import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const legacyUsers = await prisma.user.findMany({
    where: {
      password: { not: null },
      googleId: null,
      youtubeConnected: false,
    },
    select: {
      id: true,
      email: true,
      username: true,
    },
  });

  for (const user of legacyUsers) {
    console.log(`[legacy-user] ${user.id} ${user.email} (${user.username}) requires Google re-login`);
  }

  const nullified = await prisma.user.updateMany({
    where: {
      password: { not: null },
    },
    data: {
      password: null,
    },
  });

  const unconnectedGoogleUsers = await prisma.user.updateMany({
    where: {
      googleId: { not: null },
      youtubeTokens: null,
    },
    data: {
      youtubeConnected: false,
    },
  });

  console.log(`[migration] nullified passwords: ${nullified.count}`);
  console.log(`[migration] marked google users without tokens as disconnected: ${unconnectedGoogleUsers.count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
