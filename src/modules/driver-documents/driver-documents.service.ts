import prisma from '../../config/prisma';

export const uploadDocuments = async (driverId: string, files: any) => {
  const updates: any = {};

  // Handle multiple files
  if (files.license?.length) {
    updates.licenseUrls = files.license.map((f: any) => f.location);
  }
  if (files.governmentId?.length) {
    updates.governmentIdUrls = files.governmentId.map((f: any) => f.location);
  }
  if (files.vehicleDocuments?.length) {
    updates.vehicleDocumentUrls = files.vehicleDocuments.map((f: any) => f.location);
  }

  // Handle single files
  if (files.vehicleReg?.length) {
    updates.vehicleRegUrl = files.vehicleReg[0].location;
  }
  if (files.insurance?.length) {
    updates.insuranceUrl = files.insurance[0].location;
  }

  await prisma.driver.update({
    where: { id: driverId },
    data: updates,
  });

  return { 
    message: 'Documents uploaded successfully',
    uploaded: Object.keys(updates)
  };
};

export const getDocuments = async (driverId: string) => {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: {
      licenseUrls: true,
      governmentIdUrls: true,
      vehicleDocumentUrls: true,
      licenseUrl: true,
      vehicleRegUrl: true,
      insuranceUrl: true,
      documentsVerified: true,
      licenseExpiry: true,
      registrationExpiry: true,
      insuranceExpiry: true,
      inspectionExpiry: true,
      status: true,                    // pending, approved, rejected
      rejectionReason: true,
    },
  });

  if (!driver) throw new Error('Driver documents not found');

  return {
    documents: {
      license: {
        urls: driver.licenseUrls,
        expiry: driver.licenseExpiry,
        verified: driver.documentsVerified,
      },
      governmentId: {
        urls: driver.governmentIdUrls,
      },
      vehicleDocuments: {
        urls: driver.vehicleDocumentUrls,
      },
      vehicleReg: {
        url: driver.vehicleRegUrl,
        expiry: driver.registrationExpiry,
      },
      insurance: {
        url: driver.insuranceUrl,
        expiry: driver.insuranceExpiry,
      },
    },
    overallStatus: driver.status,
    rejectionReason: driver.rejectionReason,
    documentsVerified: driver.documentsVerified,
  };
};