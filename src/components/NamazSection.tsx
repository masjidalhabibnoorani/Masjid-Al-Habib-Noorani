/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { PrayerTiming } from '../types';
import { Clock, CheckCircle } from 'lucide-react';
import TiltCard from './TiltCard';

const formatTime12Hour = (timeStr: string): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return trimmed;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  if (isNaN(hours)) return trimmed;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' becomes '12'
  return `${hours}:${minutes} ${ampm}`;
};

/**
 * Calculates Sunset (Maghrib) time in HH:MM format for Wah Cantt, Pakistan.
 * Lat: 33.7837° N, Lon: 72.7153° E, UTC+5
 */
const calculateWahCanttSunset = (date: Date): { azaan: string; jamat: string } => {
  const latitude = 33.7837;
  const longitude = 72.7153;
  const timezone = 5.0; // PKT

  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (284 + dayOfYear));
  const decRad = declination * Math.PI / 180;
  const latRad = latitude * Math.PI / 180;

  const cosH = (Math.cos(90.833 * Math.PI / 180) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
  
  let H_deg = 90;
  if (cosH >= -1 && cosH <= 1) {
    H_deg = Math.acos(cosH) * 180 / Math.PI;
  }

  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const EoT = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);

  const solarNoon = 12.0 - (longitude - 15 * timezone) / 15 - EoT / 60;
  const sunsetOffset = H_deg / 15;

  const sunsetDecimal = solarNoon + sunsetOffset;
  
  const sunsetHour = Math.floor(sunsetDecimal);
  const sunsetMinute = Math.floor((sunsetDecimal - sunsetHour) * 60);

  const formatTimeStr = (h: number, m: number): string => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const azaanHour = sunsetHour;
  const azaanMin = sunsetMinute;

  let jamatMin = azaanMin + 3;
  let jamatHour = azaanHour;
  if (jamatMin >= 60) {
    jamatMin -= 60;
    jamatHour += 1;
  }

  return {
    azaan: formatTimeStr(azaanHour, azaanMin),
    jamat: formatTimeStr(jamatHour, jamatMin)
  };
};

const getProcessedTimings = (rawTimings: PrayerTiming[], date: Date): PrayerTiming[] => {
  const sunsetTimes = calculateWahCanttSunset(date);
  return rawTimings.map((prayer) => {
    if ((prayer.prayerName || '').toLowerCase() === 'maghrib') {
      return {
        ...prayer,
        azaanTime: sunsetTimes.azaan,
        prayerTime: sunsetTimes.jamat,
      };
    }
    return prayer;
  });
};

interface NamazSectionProps {
  prayerTimings: PrayerTiming[];
}

export default function NamazSection({ prayerTimings }: NamazSectionProps) {
  const [karachiTime, setKarachiTime] = useState<Date>(new Date());
  const [nextPrayerName, setNextPrayerName] = useState<string>('');
  const [nextPrayerRemaining, setNextPrayerRemaining] = useState<string>('');

  useEffect(() => {
    const interval = setInterval(() => {
      // Fetch precise Asia/Karachi time
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      });
      
      const parts = formatter.formatToParts(new Date());
      const dateMap = parts.reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {} as Record<string, string>);

      const year = parseInt(dateMap.year);
      const month = parseInt(dateMap.month) - 1;
      const day = parseInt(dateMap.day);
      const hour = parseInt(dateMap.hour);
      const minute = parseInt(dateMap.minute);
      const second = parseInt(dateMap.second);

      const computedKarachiDate = new Date(year, month, day, hour, minute, second);
      setKarachiTime(computedKarachiDate);

      // Process timings with automated sunset Maghrib time
      const processed = getProcessedTimings(prayerTimings, computedKarachiDate);
      calculateNextPrayer(computedKarachiDate, processed);

    }, 1000);

    return () => clearInterval(interval);
  }, [prayerTimings]);

  // Translate "HH:MM" into absolute seconds of the day
  const getSecondsFromMsTime = (timeStr: string, prayerName: string = ''): number => {
    if (!timeStr) return 0;
    const clean = timeStr.trim().toLowerCase();
    const hasPm = clean.includes('pm');
    const hasAm = clean.includes('am');
    const stripped = clean.replace(/am|pm/g, '').trim();
    const parts = stripped.split(':');
    if (parts.length < 2) return 0;
    
    let h = Number(parts[0]) || 0;
    const m = Number(parts[1]) || 0;
    
    if (hasPm && h < 12) {
      h += 12;
    } else if (hasAm && h === 12) {
      h = 0;
    } else if (!hasPm && !hasAm) {
      const lowerName = prayerName.toLowerCase();
      if (h < 12) {
        if (lowerName === 'zuhr' && h >= 1 && h <= 5) {
          h += 12;
        } else if (lowerName === 'jummah' && h >= 1 && h <= 3) {
          h += 12;
        } else if (lowerName === 'asr' && h >= 1 && h <= 6) {
          h += 12;
        } else if (lowerName === 'maghrib' && h >= 1 && h <= 8) {
          h += 12;
        } else if (lowerName === 'isha' && h >= 1 && h <= 10) {
          h += 12;
        } else if (lowerName === 'fajr' && h === 12) {
          h = 0;
        }
      }
    }
    
    return h * 3600 + m * 60;
  };

  const calculateNextPrayer = (currentTime: Date, activeTimings: PrayerTiming[]) => {
    if (!activeTimings || activeTimings.length === 0) return;
    const currSeconds = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
    
    let absoluteNextPrayer: PrayerTiming | null = null;
    let minDifference = Infinity; 
    let tomorrowRoll = false;

    // Filter out Jummah for general daily rotation lookup unless today is Friday
    const isFriday = currentTime.getDay() === 5;
    const activeDailyPrayers = activeTimings.filter((p) => {
      const name = p.prayerName?.toLowerCase() || '';
      if (name === 'jummah') {
        return isFriday;
      }
      if (name === 'zuhr' && isFriday) {
        return false; // On Friday, Zuhr is replaced by Jummah
      }
      return true;
    });

    activeDailyPrayers.forEach((p) => {
      const prayerSec = getSecondsFromMsTime(p.prayerTime || '', p.prayerName || '');
      let diff = prayerSec - currSeconds;
      
      if (diff > 0 && diff < minDifference) {
        minDifference = diff;
        absoluteNextPrayer = p;
      }
    });

    // If all prayers today completed, next is Fajr tomorrow
    if (!absoluteNextPrayer) {
      const fajrPrayer = activeTimings.find(p => (p.prayerName || '').toLowerCase() === 'fajr');
      if (fajrPrayer) {
        const prayerSec = getSecondsFromMsTime(fajrPrayer.prayerTime || '', 'fajr');
        minDifference = (24 * 3600 - currSeconds) + prayerSec;
        absoluteNextPrayer = fajrPrayer;
        tomorrowRoll = true;
      }
    }

    if (absoluteNextPrayer) {
      setNextPrayerName((absoluteNextPrayer as PrayerTiming).prayerName || '');
      
      const totalSec = minDifference;
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      let remainingStr = '';
      if (tomorrowRoll) {
        remainingStr += 'Kal ';
      }
      if (hours > 0) {
        remainingStr += `${hours}h `;
      }
      remainingStr += `${mins}m ${secs}s`;
      setNextPrayerRemaining(remainingStr);
    }
  };

  // Check if a prayer of any timing is within 1 hour countdown status
  const getCountdownString = (prayerTimeStr: string, name: string): { text: string; urgent: boolean } => {
    if (!prayerTimeStr) {
      return { text: 'Not Configured', urgent: false };
    }
    const hour = karachiTime.getHours();
    const minute = karachiTime.getMinutes();
    const second = karachiTime.getSeconds();
    const currSecs = hour * 3600 + minute * 60 + second;

    const targetSecs = getSecondsFromMsTime(prayerTimeStr, name);
    const diff = targetSecs - currSecs;

    const lowerName = (name || '').toLowerCase();

    // Is today Friday? If checking Zuhr on Friday, skip
    const isFriday = karachiTime.getDay() === 5;
    if (lowerName === 'zuhr' && isFriday) {
      return { text: 'Substituted by Jummah', urgent: false };
    }
    if (lowerName === 'jummah' && !isFriday) {
      return { text: 'Only on Friday', urgent: false };
    }

    if (diff > 0 && diff <= 3600) {
      const diffMins = Math.floor(diff / 60);
      const diffSecs = diff % 60;
      return {
        text: `⏳ ${diffMins}m ${diffSecs}s Remaining`,
        urgent: true
      };
    } else if (diff > 0) {
      const diffHours = Math.floor(diff / 3600);
      const diffMins = Math.floor((diff % 3600) / 60);
      return {
        text: `In ${diffHours > 0 ? diffHours + 'h ' : ''}${diffMins}m`,
        urgent: false
      };
    } else {
      return {
        text: '✅ Time Passed',
        urgent: false
      };
    }
  };

  const processed = getProcessedTimings(prayerTimings, karachiTime);

  return (
    <div id="namaz-timings-section" className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-pine-text-heading mb-4 tracking-tight flex items-center justify-center gap-3">
          <Clock className="w-8 h-8 text-pine-btn-hover animate-pulse" />
          Namaz Timings & Live Status
        </h2>
        <p className="text-pine-text-body font-sans max-w-2xl mx-auto">
          Masjid Al Habib Noorani, Wah Cantt standard timings. Real-time next prayer coordinates synchronized under Pakistan standard timezone.
        </p>

        {/* Karachi clock board (Hijri date completely removed) */}
        <div className="flex flex-wrap mt-6 gap-4 justify-center items-center">
          <div className="inline-flex gap-4 justify-center items-center py-2 px-6 rounded-full bg-pine-bar/60 border border-pine-border shadow-inner">
            <div className="text-xs text-pine-text-muted font-button uppercase tracking-wider">
              Pakistan Time:
            </div>
            <div className="text-sm md:text-base font-mono font-semibold text-pine-btn-hover">
              {karachiTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Next prayer live countdown card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <TiltCard glow className="bg-gradient-to-br from-pine-card/60 to-pine-bar/60 border-pine-btn flex-1 flex flex-col justify-between p-6">
            <div>
              <span className="text-xs font-button text-pine-text-muted uppercase tracking-wider block mb-2">
                Up Next Prayer
              </span>
              <h3 className="text-4xl font-heading font-extrabold text-white tracking-tight">
                {nextPrayerName || 'Loading...'}
              </h3>
            </div>
            
            <div className="my-8">
              <span className="text-xs font-button text-pine-text-muted uppercase tracking-wider block mb-1">
                Remaining Countdown
              </span>
              <p className="text-2xl font-mono font-bold text-pine-btn-hover tracking-wider">
                {nextPrayerRemaining || '--:--:--'}
              </p>
            </div>

            <div className="text-xs text-pine-text-body bg-pine-bar/50 py-2.5 px-3 rounded-lg border border-pine-border/60 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-pine-success shrink-0" />
              <span>Azaan, Jamat, and standard prayer timing automation enabled.</span>
            </div>
          </TiltCard>
        </div>

        {/* Namaz table representation */}
        <div className="lg:col-span-3">
          <div className="overflow-x-auto rounded-xl border border-pine-border bg-pine-bar/25 shadow-2xl">
            <table className="w-full text-left font-sans border-collapse">
              <thead>
                <tr className="bg-pine-bar text-pine-text-heading font-button text-xs uppercase tracking-wider border-b border-pine-border">
                  <th className="py-4 px-6">Prayer Name</th>
                  <th className="py-4 px-6">Azaan Time</th>
                  <th className="py-4 px-6">Namaz Time</th>
                  <th className="py-4 px-6">Countdown Status</th>
                  <th className="py-4 px-6">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine-border">
                {processed.map((prayer) => {
                  const isJummah = (prayer.prayerName || '').toLowerCase() === 'jummah';
                  const isNext = (prayer.prayerName || '').toLowerCase() === (nextPrayerName || '').toLowerCase();
                  const countdown = getCountdownString(prayer.prayerTime || '', prayer.prayerName || '');
                  
                  // Row highlighting styles:
                  // 1. Next prayer is highlighted with dynamic amber border and custom background
                  // 2. Row with urgent countdown (<60 mins remaining) highlighted in emerald
                  // 3. Jummah highlighted
                  let rowBg = 'hover:bg-pine-hover/10';
                  let rowBorder = '';
                  
                  if (isNext) {
                    rowBg = 'bg-amber-500/10 hover:bg-amber-500/15';
                    rowBorder = 'border-l-4 border-amber-500 ring-1 ring-amber-500/35';
                  } else if (countdown.urgent) {
                    rowBg = 'bg-emerald-950/40 hover:bg-emerald-950/50';
                    rowBorder = 'ring-1 ring-pine-btn/50';
                  } else if (isJummah) {
                    rowBg = 'bg-pine-active/35 hover:bg-pine-active/50 border-r-4 border-pine-btn';
                  }

                  const isMaghrib = (prayer.prayerName || '').toLowerCase() === 'maghrib';

                  return (
                    <tr
                      key={prayer.id}
                      className={`transition-colors duration-200 text-sm ${rowBg} ${rowBorder}`}
                    >
                      <td className="py-4 px-6 font-semibold text-pine-text-heading flex items-center gap-2">
                        {isNext && (
                          <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-button font-black uppercase animate-pulse">
                            NEXT
                          </span>
                        )}
                        {isJummah && <span className="text-[10px] bg-pine-btn text-white px-1.5 py-0.5 rounded font-button uppercase">FRI</span>}
                        {prayer.prayerName}
                      </td>
                      <td className="py-4 px-6 font-mono text-pine-text-body flex-col">
                        <span className="block">{formatTime12Hour(prayer.azaanTime)}</span>
                        {isMaghrib && <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider block mt-0.5">☀️ Auto Sunset</span>}
                      </td>
                      <td className="py-4 px-6 font-mono font-medium text-white">
                        {formatTime12Hour(prayer.prayerTime)}
                      </td>
                      <td className={`py-4 px-6 font-mono font-medium text-xs ${
                        countdown.urgent 
                          ? 'text-pine-warning animate-pulse'
                          : countdown.text.includes('Passed') 
                            ? 'text-pine-text-muted/60'
                            : 'text-pine-text-body'
                      }`}>
                        {countdown.text}
                      </td>
                      <td className="py-4 px-6 text-pine-text-muted italic text-xs max-w-[200px] truncate">
                        {prayer.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-4 items-center justify-between text-xs text-pine-text-muted">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-500/30 rounded inline-block border border-amber-500" />
                <span className="text-amber-400 font-medium">Up Next Prayer (Highlight)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-pine-active/50 rounded inline-block border border-pine-btn" />
                <span>Jummah Permanently Highlighted Row</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-950/50 rounded inline-block border border-emerald-500/50 animate-pulse" />
                <span>Active Countdown Highlight (&lt; 60 Mins Remaining)</span>
              </div>
            </div>
            <div className="text-[10px] font-sans text-amber-500 font-semibold uppercase tracking-wide">
              * Maghrib Azaan/Jamat times are fully automated based on solar sunset.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
