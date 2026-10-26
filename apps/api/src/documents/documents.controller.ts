import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  ServiceUnavailableException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IsString, Matches, MaxLength } from "class-validator";
import { createHash, randomBytes } from "node:crypto";
import { ONBOARDING_STEPS } from "@elevatex/shared/onboarding";
import {
  getSession,
  prisma,
  RequestLike,
  requireDatabase,
} from "../auth/session";

type UploadFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

class UploadMetadata {
  @IsString() @Matches(/^[A-Za-z0-9_-]{2,80}$/) documentType!: string;
}

class GrantBody {
  @IsString() @MaxLength(80) granteeId!: string;
}

const allowedMimeByExtension: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function verifyFileBytes(extension: string, mime: string, bytes: Buffer) {
  if (allowedMimeByExtension[extension] !== mime) return false;
  if (extension === "pdf")
    return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  if (extension === "png")
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (extension === "jpg" || extension === "jpeg")
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  if (extension === "xlsx")
    return (
      bytes.length >= 4 &&
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      bytes[2] === 0x03 &&
      bytes[3] === 0x04
    );
  if (extension === "csv") {
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      return !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text);
    } catch {
      return false;
    }
  }
  return false;
}

@Controller("documents")
export class DocumentsController {
  @Get()
  async list(@Req() request: RequestLike) {
    requireDatabase();
    const { user } = await getSession(request);
    const documents = await prisma.document.findMany({
      where: { ownerId: user.id, status: { not: "SOFT_DELETED" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        documentType: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { documents };
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  async upload(
    @UploadedFile() file: UploadFile | undefined,
    @Body() metadata: UploadMetadata,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user, role } = await getSession(request);
    const applicantRole =
      role === "founder" ? "founder" : role === "investor" ? "investor" : null;
    if (!applicantRole)
      throw new ForbiddenException(
        "Only applicant accounts can upload application documents",
      );
    if (!file || !Buffer.isBuffer(file.buffer))
      throw new BadRequestException("Choose a file before uploading");
    const allowedField = ONBOARDING_STEPS[applicantRole]
      .flatMap((step) => step.fields)
      .find(
        (field) =>
          field.id === metadata.documentType && field.type === "upload",
      );
    if (!allowedField)
      throw new BadRequestException(
        "This document type is not available for the signed-in role",
      );
    const original = file.originalname.split(/[\\/]/).pop() || "document";
    const extension = original.toLowerCase().split(".").pop() || "";
    const allowedExtensions = (allowedField.accept || ".pdf,.png,.jpg,.jpeg")
      .split(",")
      .map((entry) => entry.trim().replace(/^\./, "").toLowerCase());
    if (!allowedExtensions.includes(extension))
      throw new BadRequestException(
        "File extension is not accepted for this document field",
      );
    const maximum = /pitch/i.test(metadata.documentType)
      ? 20 * 1024 * 1024
      : 10 * 1024 * 1024;
    if (file.size > maximum)
      throw new BadRequestException(
        `File exceeds the ${maximum / 1024 / 1024} MB limit`,
      );
    if (
      file.size <= 0 ||
      !verifyFileBytes(extension, file.mimetype, file.buffer)
    )
      throw new BadRequestException(
        "File contents do not match an accepted PDF, image, CSV, or spreadsheet format",
      );
    const serviceBase = process.env.MANUS_API_URL;
    const serviceKey = process.env.MANUS_API_KEY;
    if (!serviceBase || !serviceKey)
      throw new ServiceUnavailableException(
        "Managed private storage is unavailable; the file was not accepted",
      );

    const fileName = original.slice(0, 240);
    const suffix = randomBytes(18).toString("hex");
    const storageKey = `elevatex/${user.id}/${suffix}.${extension}`;
    const contentHash = createHash("sha256").update(file.buffer).digest("hex");
    const record = await prisma.document.create({
      data: {
        ownerId: user.id,
        documentType: metadata.documentType,
        fileName,
        fileSize: file.size,
        mimeType: file.mimetype,
        contentHash,
        storageKey,
        status: "UPLOADING",
      },
      select: { id: true, storageKey: true },
    });
    try {
      const base = serviceBase.replace(/\/$/, "");
      const presignResponse = await fetch(
        `${base}/v1/storage/presign/put?path=${encodeURIComponent(storageKey)}`,
        {
          headers: { authorization: `Bearer ${serviceKey}` },
          signal: AbortSignal.timeout(15_000),
        },
      );
      const presigned = (await presignResponse.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!presignResponse.ok || typeof presigned.url !== "string")
        throw new Error("Managed storage did not issue an upload URL");
      const uploadUrl = new URL(presigned.url);
      if (
        uploadUrl.protocol !== "https:" ||
        uploadUrl.username ||
        uploadUrl.password
      )
        throw new Error("Managed storage returned an invalid upload URL");
      const bytes = file.buffer;
      const uploadBody = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      const uploaded = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.mimetype },
        body: uploadBody,
        signal: AbortSignal.timeout(90_000),
      });
      if (!uploaded.ok)
        throw new Error("Managed storage did not confirm the file upload");
      await prisma.$transaction([
        prisma.document.update({
          where: { id: record.id },
          data: { status: "PENDING_REVIEW" },
        }),
        prisma.documentEvent.create({
          data: { documentId: record.id, actorId: user.id, event: "UPLOADED" },
        }),
        prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: "DOCUMENT_UPLOADED",
            entityType: "DOCUMENT",
            entityId: record.id,
            metadata: {
              documentType: metadata.documentType,
              fileSize: file.size,
            },
          },
        }),
      ]);
      return {
        document: {
          id: record.id,
          documentType: metadata.documentType,
          fileName,
          fileSize: file.size,
          mimeType: file.mimetype,
          status: "PENDING_REVIEW",
        },
      };
    } catch {
      await prisma.document
        .update({ where: { id: record.id }, data: { status: "UPLOAD_FAILED" } })
        .catch(() => undefined);
      throw new ServiceUnavailableException(
        "Private storage did not confirm the upload. The document remains unavailable; retry explicitly.",
      );
    }
  }

  @Get(":id/open")
  async open(@Param("id") id: string, @Req() request: RequestLike) {
    requireDatabase();
    const { user, role } = await getSession(request);
    const document = await prisma.document.findUnique({
      where: { id },
      include: { grants: true },
    });
    if (
      !document ||
      document.status === "SOFT_DELETED" ||
      document.status === "UPLOAD_FAILED"
    )
      throw new NotFoundException("Document unavailable");
    const isOwner = document.ownerId === user.id;
    const isAdmin = role === "admin";
    const grant = document.grants.find(
      (entry) => entry.granteeId === user.id && entry.permission === "READ",
    );
    if (!isOwner && !isAdmin && (!grant || document.status !== "APPROVED"))
      throw new ForbiddenException(
        "This document has not been explicitly shared with your account",
      );
    const serviceBase = process.env.MANUS_API_URL;
    const serviceKey = process.env.MANUS_API_KEY;
    if (!serviceBase || !serviceKey)
      throw new ServiceUnavailableException("Managed storage is unavailable");
    const response = await fetch(
      `${serviceBase.replace(/\/$/, "")}/v1/storage/presign/get?path=${encodeURIComponent(document.storageKey)}`,
      {
        headers: { authorization: `Bearer ${serviceKey}` },
        signal: AbortSignal.timeout(15_000),
      },
    );
    const result = (await response.json().catch(() => ({}))) as {
      url?: string;
    };
    if (!response.ok || !result.url)
      throw new ServiceUnavailableException(
        "A temporary document link could not be issued",
      );
    const signed = new URL(result.url);
    if (signed.protocol !== "https:" || signed.username || signed.password)
      throw new ServiceUnavailableException("Storage returned an invalid link");
    await prisma.documentEvent.create({
      data: {
        documentId: document.id,
        actorId: user.id,
        event: isAdmin ? "ADMIN_REVIEW_VIEW" : "VIEWED",
      },
    });
    if (isAdmin)
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "ADMIN_DOCUMENT_VIEWED",
          entityType: "DOCUMENT",
          entityId: document.id,
        },
      });
    return {
      url: signed.toString(),
      expiresInSeconds: 3600,
      fileName: document.fileName,
    };
  }

  @Post(":id/grants")
  async grant(
    @Param("id") id: string,
    @Body() body: GrantBody,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user } = await getSession(request);
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document || document.status !== "APPROVED")
      throw new NotFoundException(
        "Only reviewed, approved documents can be shared",
      );
    if (document.ownerId !== user.id)
      throw new ForbiddenException("Only the document owner may share it");
    if (body.granteeId === user.id)
      throw new BadRequestException("Choose a different account");
    const connection = await prisma.connection.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: user.id, recipientId: body.granteeId },
          { requesterId: body.granteeId, recipientId: user.id },
        ],
      },
      select: { id: true },
    });
    if (!connection)
      throw new ForbiddenException(
        "Document sharing requires an accepted connection",
      );
    const grant = await prisma.documentGrant.upsert({
      where: {
        documentId_granteeId: { documentId: id, granteeId: body.granteeId },
      },
      create: { documentId: id, granteeId: body.granteeId, permission: "READ" },
      update: { permission: "READ" },
    });
    await prisma.$transaction([
      prisma.documentEvent.create({
        data: { documentId: id, actorId: user.id, event: "SHARED" },
      }),
      prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "DOCUMENT_SHARED",
          entityType: "DOCUMENT",
          entityId: id,
          metadata: { granteeId: body.granteeId, permission: "READ" },
        },
      }),
    ]);
    return {
      grant: {
        id: grant.id,
        documentId: id,
        granteeId: grant.granteeId,
        permission: grant.permission,
      },
    };
  }

  @Delete(":id/grants/:granteeId")
  async revoke(
    @Param("id") id: string,
    @Param("granteeId") granteeId: string,
    @Req() request: RequestLike,
  ) {
    requireDatabase();
    const { user } = await getSession(request);
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) throw new NotFoundException("Document unavailable");
    if (document.ownerId !== user.id)
      throw new ForbiddenException(
        "Only the document owner may revoke sharing",
      );
    const deleted = await prisma.documentGrant.deleteMany({
      where: { documentId: id, granteeId },
    });
    await prisma.documentEvent.create({
      data: { documentId: id, actorId: user.id, event: "SHARE_REVOKED" },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "DOCUMENT_SHARE_REVOKED",
        entityType: "DOCUMENT",
        entityId: id,
        metadata: { granteeId },
      },
    });
    return { revoked: deleted.count > 0 };
  }

  @Delete(":id")
  async softDelete(@Param("id") id: string, @Req() request: RequestLike) {
    requireDatabase();
    const { user } = await getSession(request);
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) throw new NotFoundException("Document unavailable");
    if (document.ownerId !== user.id)
      throw new ForbiddenException("Only the document owner may hide it");
    await prisma.$transaction([
      prisma.document.update({
        where: { id },
        data: { status: "SOFT_DELETED" },
      }),
      prisma.documentGrant.deleteMany({ where: { documentId: id } }),
      prisma.documentEvent.create({
        data: { documentId: id, actorId: user.id, event: "SOFT_DELETED" },
      }),
      prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "DOCUMENT_SOFT_DELETED",
          entityType: "DOCUMENT",
          entityId: id,
        },
      }),
    ]);
    return {
      hidden: true,
      bytesRemoved: false,
      message:
        "Document access was revoked and its index hidden. Runtime storage does not support physical deletion.",
    };
  }
}
