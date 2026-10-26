import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import {
  IsIn,
  IsISO8601,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import {
  getSession,
  prisma,
  RequestLike,
  requireApprovedInvestor,
  requireDatabase,
} from "../auth/session";

class InterestBody {
  @IsString() @MinLength(8) @MaxLength(100) startupId!: string;
}
class ConversationBody {
  @IsString() @MinLength(8) @MaxLength(100) otherUserId!: string;
}
class MessageBody {
  @IsString() @MinLength(1) @MaxLength(4000) body!: string;
}
class InterestDecisionBody {
  @IsIn(["ACCEPTED", "REJECTED"]) status!: "ACCEPTED" | "REJECTED";
}
class MeetingBody {
  @IsString() @MinLength(8) @MaxLength(100) otherUserId!: string;
  @IsString() @MinLength(2) @MaxLength(160) title!: string;
  @IsISO8601() startsAt!: string;
  @IsISO8601() endsAt!: string;
  @IsString() @MinLength(1) @MaxLength(100) timezone!: string;
}
class MeetingDecisionBody {
  @IsIn(["ACCEPTED", "DECLINED", "CANCELLED"]) status!:
    | "ACCEPTED"
    | "DECLINED"
    | "CANCELLED";
}
class MeetingRescheduleBody {
  @IsISO8601() startsAt!: string;
  @IsISO8601() endsAt!: string;
  @IsString() @MinLength(1) @MaxLength(100) timezone!: string;
}

async function acceptedConnection(userA: string, userB: string) {
  return prisma.connection.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: userA, recipientId: userB },
        { requesterId: userB, recipientId: userA },
      ],
    },
    select: { id: true },
  });
}

@Controller()
export class CollaborationController {
  @Get("connections")
  async connections(@Req() request: RequestLike) {
    requireDatabase();
    const { user } = await getSession(request);
    const rows = await prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: user.id }, { recipientId: user.id }],
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        connectedAt: row.updatedAt,
        user: row.requesterId === user.id ? row.recipient : row.requester,
      })),
    };
  }

  @Get("connections/interests")
  async interests(@Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role === "investor") {
      const rows = await prisma.interestRequest.findMany({
        where: { investor: { userId: user.id } },
        include: {
          startup: {
            select: {
              id: true,
              slug: true,
              name: true,
              tagline: true,
              industry: true,
              stage: true,
              location: true,
              publicApproved: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
      return {
        items: rows.map((row) => ({
          id: row.id,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          startup: row.startup,
        })),
      };
    }
    if (role === "founder") {
      const rows = await prisma.interestRequest.findMany({
        where: { startup: { founderId: user.id, isDemo: false } },
        include: {
          investor: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          startup: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
      return {
        items: rows.map((row) => ({
          id: row.id,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          investor: row.investor.user,
          startup: row.startup,
        })),
      };
    }
    throw new ForbiddenException("Applicant role is required");
  }

  @Post("connections/interests")
  async requestInterest(
    @Body() body: InterestBody,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "investor" || !user.investor)
      throw new ForbiddenException("Investor workspace is required");
    await requireApprovedInvestor(user.investor.id);
    const startup = await prisma.startup.findUnique({
      where: { id: body.startupId },
      select: {
        id: true,
        name: true,
        founderId: true,
        isDemo: true,
        publicApproved: true,
      },
    });
    if (
      !startup ||
      !startup.publicApproved ||
      startup.isDemo ||
      !startup.founderId
    )
      throw new NotFoundException(
        "Only an approved applicant startup can receive an interest request",
      );
    if (startup.founderId === user.id)
      throw new ForbiddenException(
        "You cannot request interest in your own startup",
      );
    const existing = await prisma.interestRequest.findUnique({
      where: {
        investorId_startupId: {
          investorId: user.investor.id,
          startupId: startup.id,
        },
      },
    });
    if (existing?.status === "PENDING" || existing?.status === "ACCEPTED")
      throw new ConflictException("An interest request already exists");
    const interest = await prisma.$transaction(async (tx) => {
      const record = existing
        ? await tx.interestRequest.update({
            where: { id: existing.id },
            data: { status: "PENDING" },
          })
        : await tx.interestRequest.create({
            data: {
              investorId: user.investor!.id,
              startupId: startup.id,
              status: "PENDING",
            },
          });
      await tx.notification.create({
        data: {
          userId: startup.founderId!,
          kind: "INVESTOR_INTEREST",
          payload: {
            interestId: record.id,
            startupId: startup.id,
            startupName: startup.name,
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "INTEREST_REQUESTED",
          entityType: "STARTUP",
          entityId: startup.id,
          metadata: { interestId: record.id },
        },
      });
      return record;
    });
    return { created: true, id: interest.id, status: interest.status };
  }

  @Patch("connections/interests/:id")
  async decideInterest(
    @Param("id") id: string,
    @Body() body: InterestDecisionBody,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "founder")
      throw new ForbiddenException("Founder workspace is required");
    const interest = await prisma.interestRequest.findUnique({
      where: { id },
      include: {
        startup: {
          select: { id: true, name: true, founderId: true, isDemo: true },
        },
        investor: { select: { id: true, userId: true } },
      },
    });
    if (
      !interest ||
      interest.startup.founderId !== user.id ||
      interest.startup.isDemo
    )
      throw new NotFoundException("Interest request unavailable");
    if (interest.status !== "PENDING")
      throw new ConflictException(
        "This interest request already has a decision",
      );
    if (body.status === "ACCEPTED")
      await requireApprovedInvestor(interest.investor.id);
    await prisma.$transaction(async (tx) => {
      await tx.interestRequest.update({
        where: { id },
        data: { status: body.status },
      });
      if (body.status === "ACCEPTED") {
        const [requesterId, recipientId] = [
          interest.investor.userId,
          user.id,
        ].sort();
        await tx.connection.upsert({
          where: { requesterId_recipientId: { requesterId, recipientId } },
          create: { requesterId, recipientId, status: "ACCEPTED" },
          update: { status: "ACCEPTED" },
        });
      }
      await tx.notification.create({
        data: {
          userId: interest.investor.userId,
          kind: `INTEREST_${body.status}`,
          payload: {
            interestId: id,
            startupId: interest.startup.id,
            startupName: interest.startup.name,
            status: body.status,
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: `INTEREST_${body.status}`,
          entityType: "INTEREST_REQUEST",
          entityId: id,
        },
      });
    });
    return { updated: true, status: body.status };
  }

  @Get("watchlist")
  async watchlist(@Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "investor" || !user.investor)
      throw new ForbiddenException("Investor workspace is required");
    const entries = await prisma.watchlistEntry.findMany({
      where: {
        investorId: user.investor.id,
        startup: { publicApproved: true, isDemo: false },
      },
      include: {
        startup: {
          select: {
            id: true,
            slug: true,
            name: true,
            tagline: true,
            industry: true,
            stage: true,
            businessModel: true,
            location: true,
            description: true,
            isDemo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      items: entries.map((entry) => ({
        id: entry.id,
        createdAt: entry.createdAt,
        startup: entry.startup,
      })),
    };
  }

  @Post("watchlist/:startupId")
  async addWatchlist(
    @Param("startupId") startupId: string,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "investor" || !user.investor)
      throw new ForbiddenException("Investor workspace is required");
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      select: { id: true, publicApproved: true, isDemo: true },
    });
    if (!startup || !startup.publicApproved || startup.isDemo)
      throw new NotFoundException(
        "Only approved applicant startups can be saved",
      );
    const entry = await prisma.watchlistEntry.upsert({
      where: {
        investorId_startupId: { investorId: user.investor.id, startupId },
      },
      create: { investorId: user.investor.id, startupId },
      update: {},
    });
    return { saved: true, id: entry.id };
  }

  @Patch("watchlist/:startupId/remove")
  async removeWatchlist(
    @Param("startupId") startupId: string,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user, role } = await getSession(request);
    if (role !== "investor" || !user.investor)
      throw new ForbiddenException("Investor workspace is required");
    await prisma.watchlistEntry.deleteMany({
      where: { investorId: user.investor.id, startupId },
    });
    return { removed: true };
  }

  @Post("conversations")
  async createConversation(
    @Body() body: ConversationBody,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user } = await getSession(request);
    if (
      body.otherUserId === user.id ||
      !(await acceptedConnection(user.id, body.otherUserId))
    )
      throw new ForbiddenException(
        "A connection must be accepted before starting a conversation",
      );
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: body.otherUserId } } },
        ],
      },
      include: { participants: { select: { userId: true } } },
    });
    if (existing && existing.participants.length === 2)
      return { id: existing.id, existing: true };
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: user.id }, { userId: body.otherUserId }],
        },
      },
    });
    return { id: conversation.id, existing: false };
  }

  @Get("conversations")
  async conversations(@Req() request: RequestLike) {
    requireDatabase();
    const { user } = await getSession(request);
    const rows = await prisma.conversation.findMany({
      where: { participants: { some: { userId: user.id } } },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, body: true, createdAt: true, senderId: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return {
      items: await Promise.all(
        rows.map(async (row) => ({
          id: row.id,
          participants: row.participants.map((p) => p.user),
          lastMessage: row.messages[0] || null,
          unreadCount: await prisma.message.count({
            where: {
              conversationId: row.id,
              senderId: { not: user.id },
              readAt: null,
            },
          }),
        })),
      ),
    };
  }

  @Get("conversations/:id")
  async conversation(@Param("id") id: string, @Req() request: RequestLike) {
    requireDatabase();
    const { user } = await getSession(request);
    const row = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        messages: { orderBy: { createdAt: "asc" }, take: 200 },
      },
    });
    if (!row || !row.participants.some((p) => p.userId === user.id))
      throw new NotFoundException("Conversation unavailable");
    return {
      id: row.id,
      participants: row.participants.map((p) => p.user),
      messages: row.messages,
    };
  }

  @Post("conversations/:id/read")
  async markConversationRead(
    @Param("id") id: string,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user } = await getSession(request);
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: user.id } },
      select: { id: true },
    });
    if (!participant) throw new NotFoundException("Conversation unavailable");
    const readAt = new Date();
    const [messages, notifications] = await prisma.$transaction([
      prisma.message.updateMany({
        where: { conversationId: id, senderId: { not: user.id }, readAt: null },
        data: { readAt },
      }),
      prisma.notification.updateMany({
        where: {
          userId: user.id,
          kind: "NEW_MESSAGE",
          readAt: null,
          payload: { path: ["conversationId"], equals: id },
        },
        data: { readAt },
      }),
    ]);
    return {
      read: true,
      messages: messages.count,
      notifications: notifications.count,
      readAt,
    };
  }

  @Post("conversations/:id/messages")
  async sendMessage(
    @Param("id") id: string,
    @Body() body: MessageBody,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user } = await getSession(request);
    const row = await prisma.conversation.findUnique({
      where: { id },
      include: { participants: { select: { userId: true } } },
    });
    const other = row?.participants.find(
      (participant) => participant.userId !== user.id,
    );
    if (
      !row ||
      !row.participants.some((participant) => participant.userId === user.id) ||
      !other
    )
      throw new NotFoundException("Conversation unavailable");
    if (!(await acceptedConnection(user.id, other.userId)))
      throw new ForbiddenException("Messaging requires an accepted connection");
    const message = await prisma.message.create({
      data: { conversationId: id, senderId: user.id, body: body.body.trim() },
    });
    await prisma.notification.create({
      data: {
        userId: other.userId,
        kind: "NEW_MESSAGE",
        payload: {
          conversationId: id,
          messageId: message.id,
          preview: message.body.slice(0, 160),
        },
      },
    });
    return { sent: true, message };
  }

  @Post("meetings")
  async createMeeting(@Body() body: MeetingBody, @Req() request: RequestLike) {
    requireDatabase();
    const { user } = await getSession(request);
    if (
      body.otherUserId === user.id ||
      !(await acceptedConnection(user.id, body.otherUserId))
    )
      throw new ForbiddenException(
        "A meeting request requires an accepted connection",
      );
    const startsAt = new Date(body.startsAt),
      endsAt = new Date(body.endsAt);
    if (
      !Number.isFinite(startsAt.getTime()) ||
      !Number.isFinite(endsAt.getTime()) ||
      startsAt <= new Date() ||
      endsAt <= startsAt ||
      endsAt.getTime() - startsAt.getTime() > 4 * 60 * 60 * 1000
    )
      throw new BadRequestException(
        "Choose a future meeting slot no longer than four hours",
      );
    try {
      new Intl.DateTimeFormat("en", { timeZone: body.timezone }).format(
        startsAt,
      );
    } catch {
      throw new BadRequestException("Provide a valid IANA time zone");
    }
    const meeting = await prisma.meeting.create({
      data: {
        creatorId: user.id,
        title: body.title.trim(),
        startsAt,
        endsAt,
        timezone: body.timezone,
        status: "PROPOSED",
        members: {
          create: [
            { userId: user.id, status: "ACCEPTED" },
            { userId: body.otherUserId, status: "INVITED" },
          ],
        },
      },
      include: { members: true },
    });
    await prisma.notification.create({
      data: {
        userId: body.otherUserId,
        kind: "MEETING_INVITATION",
        payload: {
          meetingId: meeting.id,
          title: meeting.title,
          startsAt,
          endsAt,
          timezone: body.timezone,
        },
      },
    });
    return { created: true, meeting };
  }

  @Get("meetings")
  async meetings(@Req() request: RequestLike) {
    requireDatabase();
    const { user } = await getSession(request);
    const items = await prisma.meeting.findMany({
      where: { members: { some: { userId: user.id } } },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { startsAt: "asc" },
      take: 100,
    });
    return { items };
  }

  @Patch("meetings/:id/respond")
  async respondMeeting(
    @Param("id") id: string,
    @Body() body: MeetingDecisionBody,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user } = await getSession(request);
    const member = await prisma.meetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId: id, userId: user.id } },
      include: {
        meeting: { include: { members: { select: { userId: true } } } },
      },
    });
    if (!member) throw new NotFoundException("Meeting unavailable");
    if (
      member.meeting.status === "CANCELLED" ||
      member.meeting.status === "DECLINED"
    )
      throw new ConflictException("This meeting is no longer active");
    await prisma.$transaction(async (tx) => {
      await tx.meetingParticipant.update({
        where: { id: member.id },
        data: { status: body.status },
      });
      await tx.meeting.update({ where: { id }, data: { status: body.status } });
      for (const recipient of member.meeting.members.filter(
        (p) => p.userId !== user.id,
      ))
        await tx.notification.create({
          data: {
            userId: recipient.userId,
            kind: `MEETING_${body.status}`,
            payload: { meetingId: id, status: body.status },
          },
        });
    });
    return { updated: true, status: body.status };
  }

  @Patch("meetings/:id/reschedule")
  async rescheduleMeeting(
    @Param("id") id: string,
    @Body() body: MeetingRescheduleBody,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user } = await getSession(request);
    const member = await prisma.meetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId: id, userId: user.id } },
      include: {
        meeting: { include: { members: { select: { userId: true } } } },
      },
    });
    if (!member) throw new NotFoundException("Meeting unavailable");
    if (["CANCELLED", "DECLINED"].includes(member.meeting.status))
      throw new ConflictException("This meeting is no longer active");
    const other = member.meeting.members.find(
      (entry) => entry.userId !== user.id,
    );
    if (!other || !(await acceptedConnection(user.id, other.userId)))
      throw new ForbiddenException(
        "Rescheduling requires an accepted connection",
      );
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    if (
      !Number.isFinite(startsAt.getTime()) ||
      !Number.isFinite(endsAt.getTime()) ||
      startsAt <= new Date() ||
      endsAt <= startsAt ||
      endsAt.getTime() - startsAt.getTime() > 4 * 60 * 60 * 1000
    )
      throw new BadRequestException(
        "Choose a future meeting slot no longer than four hours",
      );
    try {
      new Intl.DateTimeFormat("en", { timeZone: body.timezone }).format(
        startsAt,
      );
    } catch {
      throw new BadRequestException("Provide a valid IANA time zone");
    }
    await prisma.$transaction(async (tx) => {
      await tx.meeting.update({
        where: { id },
        data: { startsAt, endsAt, timezone: body.timezone, status: "PROPOSED" },
      });
      await tx.meetingParticipant.updateMany({
        where: { meetingId: id },
        data: { status: "INVITED" },
      });
      await tx.meetingParticipant.update({
        where: { id: member.id },
        data: { status: "ACCEPTED" },
      });
      await tx.notification.create({
        data: {
          userId: other.userId,
          kind: "MEETING_RESCHEDULED",
          payload: { meetingId: id, startsAt, endsAt, timezone: body.timezone },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "MEETING_RESCHEDULED",
          entityType: "MEETING",
          entityId: id,
        },
      });
    });
    return {
      updated: true,
      status: "PROPOSED",
      startsAt,
      endsAt,
      timezone: body.timezone,
      otherParticipantMustConfirm: true,
    };
  }

  @Get("notifications")
  async notifications(@Req() request: RequestLike) {
    requireDatabase();
    const { user } = await getSession(request);
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    ]);
    return { items, unread };
  }

  @Patch("notifications/:id/read")
  async markNotificationRead(
    @Param("id") id: string,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user } = await getSession(request);
    const updated = await prisma.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: updated.count > 0 };
  }
}
