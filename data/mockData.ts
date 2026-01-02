
import { Order, OrderType, OrderStatus, DeviceType, StockItem } from '../types';

const PRACTICES = ['Green Valley Health', 'Oak Ridge Medical', 'Lakeside Cardiology', 'Mountain View Wellness'];
const CLINICS = ['North Wing', 'South Campus', 'East Annex', 'West Plaza'];
const DEVICES = Object.values(DeviceType);

export const generateMockOrders = (count: number): Order[] => {
  return Array.from({ length: count }, (_, i) => {
    const isReturn = Math.random() > 0.7;
    const type = isReturn ? OrderType.RETURN : 
                 (Math.random() > 0.6 ? OrderType.NEW : 
                 (Math.random() > 0.5 ? OrderType.REPLACEMENT : OrderType.ADDITIONAL));
    
    const statusValues = Object.values(OrderStatus);
    const status = statusValues[Math.floor(Math.random() * statusValues.length)];
    
    // Create dates from past 30 days
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));

    // For delivered orders, randomly set assignment status (70% assigned, 30% unassigned)
    const isAssignedToPatient = status === OrderStatus.DELIVERED ? Math.random() > 0.3 : undefined;

    return {
      id: `ORD-${1000 + i}`,
      type,
      status,
      deviceType: DEVICES[Math.floor(Math.random() * DEVICES.length)],
      practiceName: PRACTICES[Math.floor(Math.random() * PRACTICES.length)],
      clinicName: CLINICS[Math.floor(Math.random() * CLINICS.length)],
      createdDate,
      deliveryDate: status === OrderStatus.DELIVERED ? new Date() : undefined,
      trackingNumber: status !== OrderStatus.PENDING ? `TRK${Math.random().toString(36).substring(7).toUpperCase()}` : undefined,
      isAssignedToPatient
    };
  });
};

export const MOCK_STOCK: StockItem[] = DEVICES.map(device => ({
  deviceType: device,
  quantity: Math.floor(Math.random() * 50) + 5,
  minLevel: 15,
  maxLevel: 100
}));

export const MOCK_ORDERS = generateMockOrders(350);
