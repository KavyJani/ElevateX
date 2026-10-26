import * as argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

async function main() {
  const {
    ELEVATEX_DATABASE_URL,
    ELEVATEX_ALLOW_ADMIN_BOOTSTRAP,
    ELEVATEX_ADMIN_EMAIL,
    ELEVATEX_ADMIN_NAME,
    ELEVATEX_ADMIN_PASSWORD,
  } = process.env;
  if (!ELEVATEX_DATABASE_URL)
    throw new Error("ELEVATEX_DATABASE_URL is required");
  if (ELEVATEX_ALLOW_ADMIN_BOOTSTRAP !== "true")
    throw new Error(
      "Set ELEVATEX_ALLOW_ADMIN_BOOTSTRAP=true only for the one-time owner bootstrap",
    );
  if (
    !ELEVATEX_ADMIN_EMAIL ||
    !ELEVATEX_ADMIN_NAME ||
    !ELEVATEX_ADMIN_PASSWORD ||
    ELEVATEX_ADMIN_PASSWORD.length < 16
  )
    throw new Error(
      "ELEVATEX_ADMIN_EMAIL, ELEVATEX_ADMIN_NAME and a 16+ character ELEVATEX_ADMIN_PASSWORD are required",
    );
  const prisma = new PrismaClient({
    datasources: { db: { url: ELEVATEX_DATABASE_URL } },
  });
  try {
    if (await prisma.user.count({ where: { role: "ADMIN" } }))
      throw new Error(
        "An admin already exists; bootstrap is one-time and will not add another administrator",
      );
    const email = ELEVATEX_ADMIN_EMAIL.trim().toLowerCase();
    if (await prisma.user.findUnique({ where: { email } }))
      throw new Error(
        "The requested email already belongs to an account; no role was elevated",
      );
    const user = await prisma.user.create({
      data: {
        email,
        name: ELEVATEX_ADMIN_NAME.trim(),
        passwordHash: await argon2.hash(ELEVATEX_ADMIN_PASSWORD, {
          type: argon2.argon2id,
        }),
        emailVerified: true,
        role: "ADMIN",
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "AUTH_ADMIN_BOOTSTRAPPED",
        entityType: "USER",
        entityId: user.id,
        metadata: {
          emailHash: (await import("node:crypto"))
            .createHash("sha256")
            .update(email)
            .digest("hex"),
        },
      },
    });
    console.log(
      `One administrator provisioned for ${email}. Remove bootstrap variables immediately.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Admin bootstrap failed",
  );
  process.exitCode = 1;
});
