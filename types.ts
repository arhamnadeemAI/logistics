
export enum OrderType {
  NEW = 'New',
  REPLACEMENT = 'Replacement',
  ADDITIONAL = 'Additional',
  RETURN = 'Return'
}

export enum OrderStatus {
  PENDING = 'Pending',
  CREATED = 'Created',
  IN_TRANSIT = 'In Transit',
  DELIVERED = 'Delivered'
}

export enum DeviceType {
  HEART_MONITOR = 'Heart Monitor',
  GLUCOMETER = 'Glucometer',
  BP_CUFF = 'BP Cuff',
  PULSE_OX = 'Pulse Oximeter',
  SMART_SCALE = 'Smart Scale'
}

export interface Order {
  id: string;
  type: OrderType;
  status: OrderStatus;
  deviceType: DeviceType;
  practiceName: string;
  clinicName: string;
  createdDate: Date;
  deliveryDate?: Date;
  trackingNumber?: string;
  isAssignedToPatient?: boolean; // New field for post-delivery tracking
}

export interface StockItem {
  deviceType: DeviceType;
  quantity: number;
  minLevel: number;
  maxLevel: number;
}

export interface PracticeStats {
  practiceName: string;
  clinicName: string;
  orderCount: number;
  rank: number;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  pendingDeliveries: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByDevice: Record<DeviceType, number>;
  agingAlerts: {
    pendingOver7Days: number;
    notCreatedOver1Day: number;
  };
  unassignedDeliveredCount: number; // New metric
}

export interface ReturnStats extends DashboardStats {
  returnedDevicesCount: number;
  returnLabelsIssued: number;
  returnPercentage: number;
}
