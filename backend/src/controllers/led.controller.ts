import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getLedStock = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = { deletedAt: null };

    if (status === 'AVAILABLE') {
      where.OR = [
        { status: 'AVAILABLE' },
        { availableQuantity: { gt: 0 } }
      ];
    } else if (status === 'IN_USE') {
      where.OR = [
        { status: 'IN_USE' },
        { inUseQuantity: { gt: 0 } }
      ];
    } else if (status) {
      where.status = status;
    }

    const stock = await prisma.ledStock.findMany({ where });
    
    const mapped = stock.map(e => {
      let computedStatus = e.status;
      if (e.availableQuantity > 0) computedStatus = 'AVAILABLE';
      else if (e.inUseQuantity > 0) computedStatus = 'IN_USE';
      else if (e.maintenanceQuantity > 0) computedStatus = 'MAINTENANCE';
      
      return { ...e, status: computedStatus };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching LED stock:', error);
    res.status(500).json({ message: 'Error fetching stock' });
  }
};

export const createLedStock = async (req: Request, res: Response) => {
  try {
    const { 
      companyName, 
      ledType, 
      cabinetHeightMm, 
      cabinetWidthMm, 
      cabinetsPerBox, 
      totalCabinets, 
      availableQuantity,
      inUseQuantity,
      maintenanceQuantity,
      pricingSqft,
      status,
      warehouseId
    } = req.body;

    const totalBoxes = Math.ceil(Number(totalCabinets) / Number(cabinetsPerBox));

    const stock = await prisma.ledStock.create({
      data: {
        companyName,
        ledType,
        cabinetHeightMm: Number(cabinetHeightMm),
        cabinetWidthMm: Number(cabinetWidthMm),
        cabinetsPerBox: Number(cabinetsPerBox),
        totalCabinets: Number(totalCabinets),
        availableQuantity: availableQuantity !== undefined ? Number(availableQuantity) : Number(totalCabinets),
        inUseQuantity: inUseQuantity ? Number(inUseQuantity) : 0,
        maintenanceQuantity: maintenanceQuantity ? Number(maintenanceQuantity) : 0,
        pricingSqft: Number(pricingSqft),
        totalBoxes: totalBoxes,
        status: status || "AVAILABLE",
        warehouseId: warehouseId ? Number(warehouseId) : null
      }
    });
    res.status(201).json(stock);
  } catch (error) {
    console.error('Error creating LED stock:', error);
    res.status(500).json({ message: 'Error creating stock' });
  }
};

export const getLedStockById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stock = await prisma.ledStock.findUnique({ where: { id: Number(id) } });
    if (!stock) {
      res.status(404).json({ message: 'Stock not found' });
      return;
    }
    res.json(stock);
  } catch (error) {
    console.error('Error fetching LED stock:', error);
    res.status(500).json({ message: 'Error fetching stock' });
  }
};

export const updateLedStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      companyName, 
      ledType, 
      cabinetHeightMm, 
      cabinetWidthMm, 
      cabinetsPerBox, 
      totalCabinets, 
      availableQuantity,
      inUseQuantity,
      maintenanceQuantity,
      pricingSqft,
      status,
      warehouseId
    } = req.body;

    const totalBoxes = Math.ceil(Number(totalCabinets) / Number(cabinetsPerBox));

    const stock = await prisma.ledStock.update({
      where: { id: Number(id) },
      data: {
        companyName,
        ledType,
        cabinetHeightMm: Number(cabinetHeightMm),
        cabinetWidthMm: Number(cabinetWidthMm),
        cabinetsPerBox: Number(cabinetsPerBox),
        totalCabinets: (availableQuantity !== undefined || inUseQuantity !== undefined || maintenanceQuantity !== undefined)
          ? (Number(availableQuantity || 0) + Number(inUseQuantity || 0) + Number(maintenanceQuantity || 0))
          : Number(totalCabinets),
        availableQuantity: availableQuantity !== undefined ? Number(availableQuantity) : undefined,
        inUseQuantity: inUseQuantity !== undefined ? Number(inUseQuantity) : undefined,
        maintenanceQuantity: maintenanceQuantity !== undefined ? Number(maintenanceQuantity) : undefined,
        pricingSqft: Number(pricingSqft),
        totalBoxes: Math.ceil(( (availableQuantity !== undefined || inUseQuantity !== undefined || maintenanceQuantity !== undefined) 
          ? (Number(availableQuantity || 0) + Number(inUseQuantity || 0) + Number(maintenanceQuantity || 0))
          : Number(totalCabinets) ) / Number(cabinetsPerBox)),
        status: status || "AVAILABLE",
        warehouseId: warehouseId ? Number(warehouseId) : null
      }
    });
    res.json(stock);
  } catch (error) {
    console.error('Error updating LED stock:', error);
    res.status(500).json({ message: 'Error updating stock' });
  }
};

export const getWarehouseAllocations = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.query;
    const allocations = await prisma.ledWarehouseAllocation.findMany({
      where: { inquiryId: Number(inquiryId) },
      include: { ledStock: true }
    });
    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ message: 'Error fetching allocations' });
  }
};

export const createWarehouseAllocation = async (req: Request, res: Response) => {
  try {
    const { inquiryId, ledStockId, allocatedSqft } = req.body;
    const allocation = await prisma.ledWarehouseAllocation.create({
      data: {
        inquiryId: Number(inquiryId),
        ledStockId: Number(ledStockId),
        allocatedSqft: Number(allocatedSqft)
      }
    });
    res.status(201).json(allocation);
  } catch (error) {
    console.error('Error creating allocation:', error);
    res.status(500).json({ message: 'Error creating allocation' });
  }
};

export const getDispatchBoxes = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.query;
    const boxes = await prisma.ledDispatchBoxEntry.findMany({
      where: { inquiryId: Number(inquiryId) }
    });
    res.json(boxes);
  } catch (error) {
    console.error('Error fetching dispatch boxes:', error);
    res.status(500).json({ message: 'Error fetching boxes' });
  }
};

export const createDispatchBox = async (req: Request, res: Response) => {
  try {
    const { inquiryId, vehicleName, vehicleNumber, companyName, numBoxes, cabinetsPerBox } = req.body;
    const totalCabinets = Number(numBoxes) * Number(cabinetsPerBox);
    
    const box = await prisma.ledDispatchBoxEntry.create({
      data: {
        inquiryId: Number(inquiryId),
        vehicleName,
        vehicleNumber,
        companyName,
        numBoxes: Number(numBoxes),
        cabinetsPerBox: Number(cabinetsPerBox),
        totalCabinets
      }
    });
    res.status(201).json(box);
  } catch (error) {
    console.error('Error creating dispatch box:', error);
    res.status(500).json({ message: 'Error creating box' });
  }
};

export const deleteLedStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.ledStock.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });
    res.json({ message: 'LED stock soft-deleted successfully' });
  } catch (error) {
    console.error('Error deleting LED stock:', error);
    res.status(500).json({ message: 'Error deleting LED stock' });
  }
};

export const getLedArrangements = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.query;
    const arrangements = await prisma.ledVendorArrangement.findMany({
      where: { inquiryId: Number(inquiryId) },
      include: { vendor: true }
    });
    res.json(arrangements);
  } catch (error) {
    console.error('Error fetching LED vendor arrangements:', error);
    res.status(500).json({ message: 'Error fetching arrangements' });
  }
};

export const createLedArrangement = async (req: Request, res: Response) => {
  try {
    const { inquiryId, vendorId, ledType, sqftArranged, costRatePerSqftPerDay, days } = req.body;
    
    const vendor = await prisma.vendor.findUnique({
      where: { id: Number(vendorId) }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const totalCost = Number(sqftArranged) * Number(costRatePerSqftPerDay) * Number(days);

    const arrangement = await prisma.ledVendorArrangement.create({
      data: {
        inquiryId: Number(inquiryId),
        vendorId: Number(vendorId),
        vendorName: vendor.name,
        ledType,
        sqftArranged: Number(sqftArranged),
        costRatePerSqftPerDay: Number(costRatePerSqftPerDay),
        days: Number(days),
        totalCost,
        status: 'ARRANGED'
      }
    });

    res.status(201).json(arrangement);
  } catch (error) {
    console.error('Error creating LED vendor arrangement:', error);
    res.status(500).json({ message: 'Error creating arrangement' });
  }
};

export const deleteLedArrangement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.ledVendorArrangement.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Arrangement deleted successfully' });
  } catch (error) {
    console.error('Error deleting LED vendor arrangement:', error);
    res.status(500).json({ message: 'Error deleting arrangement' });
  }
};

export const getLedTypeRates = async (req: Request, res: Response) => {
  try {
    const rates = await prisma.ledTypeRate.findMany();
    res.json(rates);
  } catch (error) {
    console.error('Error fetching LED type rates:', error);
    res.status(500).json({ message: 'Error fetching LED type rates' });
  }
};

export const updateLedTypeRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ratePerSqftPerDay } = req.body;
    const rate = await prisma.ledTypeRate.update({
      where: { id: Number(id) },
      data: { ratePerSqftPerDay: Number(ratePerSqftPerDay) }
    });
    res.json(rate);
  } catch (error) {
    console.error('Error updating LED type rate:', error);
    res.status(500).json({ message: 'Error updating LED type rate' });
  }
};

export const getLedQuotationSqftSummary = async (req: Request, res: Response) => {
  try {
    const { quotationId } = req.query;
    if (!quotationId) {
      res.status(400).json({ message: 'Quotation ID is required' });
      return;
    }
    const items = await prisma.ledQuotationItem.findMany({
      where: { quotationId: Number(quotationId) }
    });

    let perDaySqft = 0;
    let totalEventSqft = 0;
    const byPlaceMap: { [key: string]: number } = {};
    const byTypeMap: { [key: string]: number } = {};

    items.forEach(item => {
      const itemSqftPerDay = Number(item.sqftPerDay || (Number(item.heightFt) * Number(item.widthFt) * Number(item.nos)));
      const itemTotalSqft = itemSqftPerDay * Number(item.days);
      
      perDaySqft += itemSqftPerDay;
      totalEventSqft += itemTotalSqft;

      byPlaceMap[item.placeName] = (byPlaceMap[item.placeName] || 0) + itemSqftPerDay;
      byTypeMap[item.ledType] = (byTypeMap[item.ledType] || 0) + itemSqftPerDay;
    });

    const totalDays = items.length > 0 ? Math.max(...items.map(item => item.days)) : 0;

    res.json({
      perDaySqft,
      totalDays,
      totalEventSqft,
      byPlace: Object.entries(byPlaceMap).map(([placeName, sqft]) => ({ placeName, sqft })),
      byType: Object.entries(byTypeMap).map(([ledType, sqft]) => ({ ledType, sqft }))
    });
  } catch (error) {
    console.error('Error calculating LED sqft summary:', error);
    res.status(500).json({ message: 'Error calculating LED sqft summary' });
  }
};

import { calculateClearSize } from '../services/ledClearSize.service';

export const calculateClearSizeController = async (req: Request, res: Response) => {
  try {
    const { cabinetHeightMm, cabinetWidthMm, targetHeightFt, targetWidthFt } = req.body;
    if (!cabinetHeightMm || !cabinetWidthMm || !targetHeightFt || !targetWidthFt) {
      res.status(400).json({ message: 'All parameters (cabinetHeightMm, cabinetWidthMm, targetHeightFt, targetWidthFt) are required' });
      return;
    }
    const result = calculateClearSize(
      Number(cabinetHeightMm),
      Number(cabinetWidthMm),
      Number(targetHeightFt),
      Number(targetWidthFt)
    );
    res.json(result);
  } catch (error) {
    console.error('Error calculating LED clear size:', error);
    res.status(500).json({ message: 'Error calculating LED clear size' });
  }
};
