import { prisma } from '@/lib/prisma';
import { addDays, format, startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export const metadata = { title: '쿼터 관리 | 호텔어라운드 평창' };

const SEASON_COLORS: Record<string, string> = {
  PEAK: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  NORMAL: 'bg-white text-gray-800 border-gray-200',
  LOW: 'bg-blue-50 text-blue-800 border-blue-200',
};

export default async function AdminQuotaPage() {
  const today = startOfDay(new Date());
  const endDate = addDays(today, 60);

  const quotas = await prisma.dailyQuota.findMany({
    where: { quotaDate: { gte: today, lte: endDate } },
    orderBy: { quotaDate: 'asc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">쿼터 관리</h1>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> 여유(10+)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded" /> 부족(1~10)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded" /> 마감</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-800 rounded" /> 블랙아웃</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="grid grid-cols-7 gap-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted py-1">{day}</div>
          ))}

          {/* Pad start */}
          {Array.from({ length: quotas[0] ? new Date(quotas[0].quotaDate).getDay() : 0 }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {quotas.map(q => {
            const available = q.maxVoucherRooms - q.reservedRooms;
            const date = new Date(q.quotaDate);
            const colorClass = q.isBlackout
              ? 'bg-gray-800 text-white border-gray-700'
              : available > 10
              ? 'bg-green-50 text-green-800 border-green-200'
              : available > 0
              ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
              : 'bg-red-50 text-red-800 border-red-200';

            return (
              <div
                key={q.quotaDate.toISOString()}
                className={`border rounded-lg p-2 text-center text-xs ${colorClass}`}
                title={`${format(date, 'yyyy-MM-dd')}: ${available}실 가용 / ${q.maxVoucherRooms}실 전체`}
              >
                <div className="font-bold text-sm">{date.getDate()}</div>
                <div>{q.isBlackout ? 'X' : `${available}/${q.maxVoucherRooms}`}</div>
                {q.surchargePerNight > 0 && (
                  <div className="text-[10px] mt-0.5">+{(q.surchargePerNight / 10000).toFixed(0)}만</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
