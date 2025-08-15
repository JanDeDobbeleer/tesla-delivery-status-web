import React, { useState } from 'react';
import { CombinedOrder, OrderDiff } from '../types';
import { CalendarIcon, CarIcon, ClockIcon, GeoIcon, GaugeIcon, KeyIcon, PinIcon, CompanyIcon, OptionsIcon, DeliveryIcon, ChevronDownIcon, ETAIcon, ChecklistIcon, TasksIcon, HistoryIcon, JsonIcon } from './icons';
import { COMPOSITOR_BASE_URL, FALLBACK_CAR_IMAGE_URLS } from '../constants';
import { TESLA_STORES } from '../data/tesla-stores';
import OrderTimeline from './OrderTimeline';
import DeliveryChecklist from './DeliveryChecklist';
import VehicleOptions from './VehicleOptions';
import TasksList from './TasksList';
import HistoryModal from './HistoryModal';
import JsonViewer from './JsonViewer';

interface OrderCardProps {
  combinedOrder: CombinedOrder;
  diff: OrderDiff;
}

const DetailItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  diffValue?: { old: any; new: any };
}> = ({ icon, label, value, diffValue }) => {
  const hasChanged = diffValue && JSON.stringify(diffValue.old) !== JSON.stringify(diffValue.new);

  const oldValueOrDefault = (val: any) => {
    // Treat undefined, null, and empty strings as 'N/A'
    if (val === undefined || val === null || val === '') {
      return 'N/A';
    }
    return val;
  };

  const displayValue = hasChanged ? oldValueOrDefault(diffValue.new) : oldValueOrDefault(value);
  const highlightClass = hasChanged ? 'bg-yellow-500/10 ring-1 ring-inset ring-yellow-500/20' : '';
  const valueClass = (displayValue === 'N/A') ? 'text-gray-400 dark:text-tesla-gray-500 font-normal' : 'text-gray-800 dark:text-white font-semibold';

  return (
    <div className={`flex items-start space-x-3 p-3 rounded-lg ${highlightClass}`}>
      <div className="flex-shrink-0 h-6 w-6 text-gray-400 dark:text-tesla-gray-400 pt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-tesla-gray-400">{label}</p>
        <p className={`text-base break-words ${valueClass}`}>{displayValue}</p>
        {hasChanged && (
          <p className="text-xs text-yellow-400 mt-1">
            From: <span className="line-through">{oldValueOrDefault(diffValue.old)}</span>
          </p>
        )}
      </div>
    </div>
  );
};

const normalizeModelCode = (apiCode?: string): string => {
    if (!apiCode) return 'UNKNOWN';
    const code = apiCode.toLowerCase().replace(/model\s?/i, '').trim();
    switch (code) {
        case 'ms': case 's': return 'S';
        case 'm3': case '3': return '3';
        case 'mx': case 'x': return 'X';
        case 'my': case 'y': return 'Y';
        case 'ct': case 'cybertruck': return 'CYBERTRUCK';
        default:
            const upperCode = apiCode.toUpperCase();
            return upperCode in FALLBACK_CAR_IMAGE_URLS ? upperCode : apiCode;
    }
};

const getModelApiCode = (apiCode?: string): string | null => {
    if (!apiCode) return null;
    const code = apiCode.toLowerCase().replace(/model\s?/i, '').trim();
    switch (code) {
        case 'ms': case 's': return 'ms';
        case 'm3': case '3': return 'm3';
        case 'mx': case 'x': return 'mx';
        case 'my': case 'y': return 'my';
        case 'ct': case 'cybertruck': return 'ct';
        default:
            return null;
    }
};

const generateCompositorUrl = (orderData: CombinedOrder['order'], view: 'STUD_3QTR' | 'STUD_SEAT'): string | null => {
      const model = getModelApiCode(orderData.modelCode);
      const options = orderData.mktOptions;

      if (!model || !options) {
        return null;
      }
      
      const formattedOptions = options.split(',').filter(o => o.trim()).map(o => `$${o.trim()}`).join(',');

      const baseParams: Record<string, string> = {
          context: 'design_studio_2',
          bkba_opt: '1',
          model,
          options: formattedOptions,
      };

      if (view === 'STUD_3QTR') {
          baseParams.view = 'STUD_3QTR';
          baseParams.size = '800';
          baseParams.crop = '1150,647,390,180';
      } else { // STUD_SEAT
          baseParams.view = 'STUD_SEAT';
          baseParams.size = '600';
      }

      const params = new URLSearchParams(baseParams);
      return `${COMPOSITOR_BASE_URL}?${params.toString()}`;
};


const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusLower = status.toLowerCase();
    let colorClasses = 'bg-gray-500 text-gray-100'; // Default
    if (statusLower.includes('book')) {
        colorClasses = 'bg-blue-500 text-white';
    } else if (statusLower.includes('progress') || statusLower.includes('pending')) {
        colorClasses = 'bg-yellow-500 text-white';
    } else if (statusLower.includes('delivered') || statusLower.includes('complete')) {
        colorClasses = 'bg-green-500 text-white';
    } else if (statusLower.includes('cancel')) {
        colorClasses = 'bg-red-500 text-white';
    }

    return (
        <span className={`px-2.5 py-1 text-sm font-semibold rounded-full ${colorClasses}`}>
            {status}
        </span>
    );
};


const OrderCard: React.FC<OrderCardProps> = ({ combinedOrder, diff }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeView, setActiveView] = useState<'details' | 'checklist' | 'tasks' | 'json'>('details');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const { order, details } = combinedOrder;

  const getDiffFor = (path: string) => diff[path];
  
  const getVehicleLocationName = (locationCode?: string) => {
    if (!locationCode) return 'N/A';
    return TESLA_STORES[locationCode] || `Unknown Code (${locationCode})`;
  };

  const getOdometer = () => {
    const odometerValue = details?.tasks?.registration?.orderDetails?.vehicleOdometer;
    if (!odometerValue) return 'N/A';
    return `${odometerValue} ${details?.tasks?.registration?.orderDetails?.vehicleOdometerType || ''}`.trim();
  }

  const formatDeliveryType = (type?: string) => {
    if (!type) return 'N/A';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  const createDiffWithValue = (path: string, transformFn?: (val: any) => string) => {
    const d = getDiffFor(path);
    // Safe navigation for deeply nested properties
    const value = path.split('.').reduce((o, i) => o?.[i], combinedOrder as any);
    const transformedValue = transformFn && value ? transformFn(value) : value;

    if (d) {
        return {
            diffValue: { old: transformFn && d.old ? transformFn(d.old) : d.old, new: transformFn && d.new ? transformFn(d.new) : d.new },
            value: transformedValue
        };
    }
    return { value: transformedValue };
  };

  const modelCode = normalizeModelCode(order.modelCode);
  const fallbackImageUrl = modelCode ? FALLBACK_CAR_IMAGE_URLS[modelCode] : undefined;
  const exteriorImageUrl = generateCompositorUrl(order, 'STUD_3QTR') || fallbackImageUrl;
  const interiorImageUrl = generateCompositorUrl(order, 'STUD_SEAT');

  const vin = createDiffWithValue('order.vin');
  const deliveryWindow = createDiffWithValue('details.tasks.scheduling.deliveryWindowDisplay');
  const appointment = createDiffWithValue('details.tasks.scheduling.apptDateTimeAddressStr');
  const eta = createDiffWithValue('details.tasks.finalPayment.data.etaToDeliveryCenter');
  const vehicleLocation = createDiffWithValue('details.tasks.registration.orderDetails.vehicleRoutingLocation', getVehicleLocationName);
  const deliveryMethod = createDiffWithValue('details.tasks.scheduling.deliveryType', formatDeliveryType);
  const deliveryCenter = createDiffWithValue('details.tasks.scheduling.deliveryAddressTitle');
  const odometer = createDiffWithValue('details.tasks.registration.orderDetails.vehicleOdometer', getOdometer);
  const reservationDate = createDiffWithValue('details.tasks.registration.orderDetails.reservationDate', val => val ? new Date(val).toLocaleDateString() : 'N/A');
  const orderBookedDate = createDiffWithValue('details.tasks.registration.orderDetails.orderBookedDate', val => val ? new Date(val).toLocaleDateString() : 'N/A');
  const companyName = createDiffWithValue('order.ownerCompanyName');
  const mktOptions = createDiffWithValue('order.mktOptions');

  const TabButton: React.FC<{
    view: 'details' | 'checklist' | 'tasks' | 'json';
    label: string;
    icon: React.ReactNode;
  }> = ({ view, label, icon }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex-1 whitespace-nowrap flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-tesla-gray-800 ${
        activeView === view
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-500 dark:text-tesla-gray-400 border-b-2 border-transparent hover:bg-gray-100 dark:hover:bg-tesla-gray-700/50'
      }`}
      aria-pressed={activeView === view}
      role="tab"
    >
      {icon}
      {label}
    </button>
  );

  return (
    <>
      <div className="bg-white dark:bg-tesla-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col h-full border border-gray-200 dark:border-tesla-gray-700/50 transition-all duration-300 ease-in-out hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-tesla-red/10">
        {exteriorImageUrl && (
          <div className="relative group bg-gray-100 dark:bg-black/20 p-4 flex justify-center items-center h-48 cursor-pointer" title={interiorImageUrl ? "Hover to view interior" : ""}>
            <img
              src={exteriorImageUrl}
              alt={`Tesla Model ${modelCode}`}
              className={`h-full object-contain transition-all duration-300 ease-in-out group-hover:scale-105 ${interiorImageUrl ? 'group-hover:opacity-0' : ''}`}
              loading="lazy"
            />
            {interiorImageUrl && (
                <img
                    src={interiorImageUrl}
                    alt={`Tesla Model ${modelCode} Interior`}
                    className="absolute inset-0 w-full h-full object-contain p-4 transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100 group-hover:scale-105"
                    loading="lazy"
                />
            )}
          </div>
        )}
        <div className="p-5 border-b border-gray-200 dark:border-tesla-gray-700/50">
          <div className="flex justify-between items-start gap-4">
              <div>
                   <div className="flex items-center space-x-3">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">Model {modelCode}</p>
                      {order.isUsed && (
                          <span className="text-xs font-semibold bg-amber-500/80 text-white px-2 py-0.5 rounded-full">
                              USED
                          </span>
                      )}
                   </div>
                   <p className="text-xs font-mono text-gray-500 dark:text-tesla-gray-400 mt-1">{order.referenceNumber}</p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="p-2 rounded-full text-gray-500 dark:text-tesla-gray-400 hover:bg-gray-200 dark:hover:bg-tesla-gray-700 transition-all duration-150 active:scale-90 active:bg-gray-300 dark:active:bg-tesla-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-tesla-gray-800"
                      aria-label="View Order History"
                  >
                      <HistoryIcon className="w-5 h-5" />
                  </button>
                  <OrderStatusBadge status={order.orderStatus} />
              </div>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-tesla-gray-700/50">
          <OrderTimeline combinedOrder={combinedOrder} />
        </div>

        {/* --- View Switcher --- */}
        <div className="flex border-b border-gray-200 dark:border-tesla-gray-700/50 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" role="tablist">
          <TabButton view="details" label="Order Details" icon={<CarIcon className="w-5 h-5" />} />
          <TabButton view="tasks" label="App Tasks" icon={<TasksIcon className="w-5 h-5" />} />
          <TabButton view="checklist" label="Delivery Checklist" icon={<ChecklistIcon className="w-5 h-5" />} />
          <TabButton view="json" label="Full JSON" icon={<JsonIcon className="w-5 h-5" />} />
        </div>

        {/* --- Conditional Content --- */}
        {activeView === 'details' && (
          <div className="flex-grow flex flex-col" role="tabpanel">
            <div className="p-5 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                  <DetailItem icon={<KeyIcon />} label="VIN" value={vin.value} diffValue={vin.diffValue} />
                  <DetailItem icon={<ETAIcon />} label="ETA to Delivery Center" value={eta.value} diffValue={eta.diffValue} />
                  
                  <div className="md:col-span-2">
                      <DetailItem icon={<ClockIcon />} label="Delivery Window" value={deliveryWindow.value} diffValue={deliveryWindow.diffValue} />
                  </div>
                  <div className="md:col-span-2">
                      <DetailItem icon={<PinIcon />} label="Delivery Appointment" value={appointment.value} diffValue={appointment.diffValue} />
                  </div>

                  <DetailItem icon={<CarIcon />} label="Vehicle Location" value={vehicleLocation.value} diffValue={vehicleLocation.diffValue} />
                  <DetailItem icon={<DeliveryIcon />} label="Delivery Method" value={deliveryMethod.value} diffValue={deliveryMethod.diffValue} />
                  <DetailItem icon={<GeoIcon />} label="Delivery Center" value={deliveryCenter.value} diffValue={deliveryCenter.diffValue} />
                  <DetailItem icon={<GaugeIcon />} label="Odometer" value={odometer.value} diffValue={odometer.diffValue} />
                  <DetailItem icon={<CalendarIcon />} label="Order Booked Date" value={orderBookedDate.value} diffValue={orderBookedDate.diffValue} />
                  
                  {order.isB2b && <div className="md:col-span-2"><DetailItem icon={<CompanyIcon />} label="Company" value={companyName.value} diffValue={companyName.diffValue} /></div>}
              </div>
              
              <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-screen mt-4 pt-4 border-t border-gray-200 dark:border-tesla-gray-700/50' : 'max-h-0'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                      <DetailItem icon={<CalendarIcon />} label="Reservation Date" value={reservationDate.value} diffValue={reservationDate.diffValue} />
                      <div className={`md:col-span-2 flex items-start space-x-3 p-3 rounded-lg ${mktOptions.diffValue ? 'bg-yellow-500/10 ring-1 ring-inset ring-yellow-500/20' : ''}`}>
                          <div className="flex-shrink-0 h-6 w-6 text-gray-400 dark:text-tesla-gray-400 pt-0.5"><OptionsIcon /></div>
                          <div className="w-full overflow-hidden">
                              <p className="text-sm font-medium text-gray-500 dark:text-tesla-gray-400">Vehicle Options</p>
                              <VehicleOptions
                                  optionsString={mktOptions.value}
                                  diffValue={mktOptions.diffValue}
                              />
                          </div>
                      </div>
                  </div>
              </div>
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-tesla-gray-700/50">
                <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-center items-center text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-tesla-gray-300 dark:hover:text-white transition-all duration-150 py-1 rounded-md active:bg-gray-100 dark:active:bg-tesla-gray-700/50">
                  {isExpanded ? 'Show Less' : 'Show More Details'}
                  <ChevronDownIcon className={`w-5 h-5 ml-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>
          </div>
        )}

        {activeView === 'tasks' && (
          <div role="tabpanel" className="flex-grow">
            <TasksList tasksData={details.tasks} />
          </div>
        )}

        {activeView === 'checklist' && (
          <div role="tabpanel">
              <DeliveryChecklist orderReferenceNumber={order.referenceNumber} />
          </div>
        )}

        {activeView === 'json' && (
          <div role="tabpanel" className="flex-grow">
            <JsonViewer data={combinedOrder} />
          </div>
        )}
      </div>

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        orderReferenceNumber={order.referenceNumber}
      />
    </>
  );
};

export default OrderCard;