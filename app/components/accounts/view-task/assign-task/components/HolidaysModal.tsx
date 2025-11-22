import React from "react";

export interface Holiday {
  date: string;
  name: string;
  description: string;
}

export const staticHolidays: Holiday[] = [
  { date: "January 1", name: "New Year's Day", description: "A national holiday to mark the beginning of the new year." },
  { date: "January 15-18", name: "Pongal holidays", description: "Harvest festival holidays." },
  { date: "January 26", name: "Republic Day", description: "A national holiday to commemorate the adoption of the Indian Constitution." },
  { date: "Varies", name: "Shivaratri", description: "A holiday to mark the occasion of Lord Shiva's birthday." },
  { date: "March 19", name: "Ugadi", description: "A holiday to mark the Telugu New Year." },
  { date: "March 19 or 20", name: "Ramadan", description: "A holiday to mark the Islamic holy month of Ramadan (date may vary)." },
  { date: "April 3", name: "Good Friday", description: "A holiday observed during the Holy Week." },
  { date: "April 14", name: "Ambedkar Jayanti", description: "A national holiday to mark the birth anniversary of Dr. BR Ambedkar." },
  { date: "May 1", name: "Labor's Day", description: "A holiday celebrating workers and laborers." },
  { date: "May 28", name: "Bakrid", description: "Eid al-Adha (date may vary)." },
  { date: "August 15", name: "Independence Day", description: "A national holiday to mark India's independence." },
  { date: "September 4", name: "Krishna Janmashtami", description: "A holiday to mark the birth of Lord Krishna." },
  { date: "September 14", name: "Vinayaka Chavithi", description: "A holiday to mark the occasion of Lord Ganesha's birthday." },
  { date: "October 2", name: "Gandhi Jayanti", description: "A national holiday to mark the birth anniversary of Mahatma Gandhi." },
  { date: "October 19", name: "Durga Ashtami", description: "A holiday in many states to mark the occasion of Durga Puja." },
  { date: "October 20", name: "Dussehra", description: "A holiday in Telugu states to mark the victory of good over evil." },
  { date: "November 1", name: "Pondicherry Liberation Day", description: "A holiday to commemorate the de facto merger of Puducherry with the Indian Union (Regional Holiday)." },
  { date: "November 8", name: "Diwali", description: "A holiday to mark the festival of lights." },
  { date: "November 24", name: "check", description: "A holiday to mark the festival of lights." },
  { date: "November 25", name: "check", description: "A holiday to mark the festival of lights." },
  { date: "November 26", name: "check", description: "A holiday to mark the festival of lights." },
  { date: "November 27", name: "check", description: "A holiday to mark the festival of lights." },
  { date: "December 25", name: "Christmas", description: "A holiday to mark the birth of Jesus Christ." },
  { date: "December 31", name: "New Year's Eve", description: "A holiday in some private companies to mark the end of the year." },
];

interface HolidaysModalProps {
  open: boolean;
  onClose: () => void;
}

const HolidaysModal: React.FC<HolidaysModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Company Holidays 2025</h2>
              <p className="text-blue-100 text-sm mt-1">Official holiday calendar</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all duration-200"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-8">
        
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="max-h-[55vh] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-blue-600 text-white sticky top-0 z-10">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-semibold">Date</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold">Holiday Name</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {staticHolidays.map((h, idx) => (
                    <tr 
                      key={h.name + h.date} 
                      className="hover:bg-blue-50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-blue-600 whitespace-nowrap">
                        {h.date}
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-gray-900">
                        {h.name}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {h.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Total holidays: <span className="font-semibold text-gray-700">{staticHolidays.length}</span>
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidaysModal;