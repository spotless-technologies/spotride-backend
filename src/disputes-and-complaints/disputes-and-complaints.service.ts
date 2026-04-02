import prisma from '../config/prisma';

export const getDisputesStats = async () => {
  const [totalDisputes, open, underReview, highPriority] = await Promise.all([
    prisma.dispute.count(),
    prisma.dispute.count({ where: { status: 'Open' } }),
    prisma.dispute.count({ where: { status: 'Under Review' } }),
    prisma.dispute.count({ where: { severity: 'High' } }),
  ]);

  return { totalDisputes, open, underReview, highPriority };
};

export const getDisputes = async (page: number = 1, limit: number = 20, status?: string, severity?: string, search?: string) => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status && status !== 'all') where.status = status;
  if (severity && severity !== 'all') where.severity = severity;
  if (search) {
    where.OR = [
      { disputeId: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      skip,
      take: limit,
      where,
      include: {
        rentalBooking: {
          include: {
            driver: { include: { user: true } },
            car: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dispute.count({ where }),
  ]);

  return {
    data: disputes,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const getDisputeById = async (id: string) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      rentalBooking: {
        include: {
          driver: { include: { user: true } },
          car: { include: { owner: { include: { user: true } } } },
        }
      }
    }
  });

  if (!dispute) throw new Error('Dispute not found');
  return dispute;
};

export const resolveDispute = async (id: string, data: any) => {
  return prisma.dispute.update({
    where: { id },
    data: {
      resolutionAction: data.resolutionAction,
      resolutionNotes: data.resolutionNotes,
      status: 'Resolved',
      resolvedAt: new Date(),
    },
  });
};