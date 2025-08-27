import React, { useState, useMemo } from 'react';
import { ChevronDownIcon } from './icons';
import { 
    WMI_MAP, 
    MODEL_MAP, 
    DRIVE_UNIT_MAP, 
    YEAR_MAP, 
    PLANT_MAP,
    BODY_TYPE_MAP,
    RESTRAINT_SYSTEM_MAP,
    FUEL_TYPE_MAP
} from '../data/vin-decoder-map';

interface VinDecoderProps {
  vin: string;
}

const decodeVin = (vin: string): Record<string, string> | null => {
    if (!vin || vin.length !== 17) {
        return null;
    }

    const vinUpper = vin.toUpperCase();
    
    const wmi = vinUpper.substring(0, 3);
    const modelChar = vinUpper.charAt(3);
    const bodyTypeChar = vinUpper.charAt(4);
    const restraintChar = vinUpper.charAt(5);
    const fuelTypeChar = vinUpper.charAt(6);
    const motorChar = vinUpper.charAt(7);
    const yearChar = vinUpper.charAt(9);
    const plantChar = vinUpper.charAt(10);
    const serial = vinUpper.substring(11);

    const decoded: Record<string, string> = {};

    decoded['Manufacturer'] = WMI_MAP[wmi] || 'Unknown';
    
    const modelName = MODEL_MAP[modelChar];
    decoded['Model'] = modelName || 'Unknown';

    if (BODY_TYPE_MAP[modelChar] && BODY_TYPE_MAP[modelChar][bodyTypeChar]) {
        decoded['Body Type'] = BODY_TYPE_MAP[modelChar][bodyTypeChar];
    }

    if (RESTRAINT_SYSTEM_MAP[modelChar] && RESTRAINT_SYSTEM_MAP[modelChar][restraintChar]) {
        decoded['Restraint System'] = RESTRAINT_SYSTEM_MAP[modelChar][restraintChar];
    }

    decoded['Fuel Type'] = FUEL_TYPE_MAP[fuelTypeChar] || 'Unknown';
    
    if (DRIVE_UNIT_MAP[modelChar] && DRIVE_UNIT_MAP[modelChar][motorChar]) {
        decoded['Powertrain'] = DRIVE_UNIT_MAP[modelChar][motorChar];
    } else {
        decoded['Powertrain'] = 'Unknown';
    }

    decoded['Model Year'] = YEAR_MAP[yearChar]?.toString() || 'Unknown';
    decoded['Manufacturing Plant'] = PLANT_MAP[plantChar] || 'Unknown';
    decoded['Serial Number'] = serial;
    decoded['Full VIN'] = vinUpper;

    return decoded;
};

const DecodedItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline py-2">
        <dt className="text-sm text-gray-500 dark:text-tesla-gray-400">{label}</dt>
        <dd className="text-sm font-semibold text-gray-800 dark:text-white text-right break-all">{value}</dd>
    </div>
);


const VinDecoder: React.FC<VinDecoderProps> = ({ vin }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const decodedData = useMemo(() => decodeVin(vin), [vin]);

  if (!decodedData) {
    return null;
  }

  return (
    <div className="mt-3">
      <button 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="w-full flex justify-between items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-md transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-expanded={isExpanded}
        aria-controls={`vin-details-${vin}`}
      >
        <span>Decode VIN</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      <div 
        id={`vin-details-${vin}`}
        className={`transition-all duration-500 ease-in-out grid ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
          <div className="overflow-hidden">
            <div className="mt-2 p-4 bg-gray-50 dark:bg-tesla-gray-900/50 rounded-lg border border-gray-200 dark:border-tesla-gray-700">
                <dl className="divide-y divide-gray-200 dark:divide-tesla-gray-700/50">
                    {Object.entries(decodedData).map(([key, value]) => (
                        <DecodedItem key={key} label={key} value={value} />
                    ))}
                </dl>
            </div>
          </div>
      </div>
    </div>
  );
};

export default VinDecoder;
