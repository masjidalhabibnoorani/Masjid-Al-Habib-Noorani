/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Announcement } from '../types';
import { Calendar, Bell } from 'lucide-react';

interface MarqueeProps {
  announcements: Announcement[];
}

export default function Marquee({ announcements }: MarqueeProps) {
  const activeAnnouncements = announcements.filter(
    (ann) => ann.active && (!ann.expiryDate || new Date(ann.expiryDate) >= new Date())
  );

  if (activeAnnouncements.length === 0) {
    return (
      <div className="bg-pine-bar py-2.5 text-center text-xs text-pine-text-muted select-none border-b border-pine-border font-button">
        🍃 Masjid Al Habib Noorani: No current announcements. See schedule details below.
      </div>
    );
  }

  // Concatenate active items into a single sentence stream
  const announcementText = activeAnnouncements
    .map((ann) => `【 ${ann.title.toUpperCase()}: ${ann.content} 】`)
    .join('  •  ');

  return (
    <div className="bg-pine-bar border-b border-pine-border text-pine-text-heading overflow-hidden whitespace-nowrap py-2.5 relative z-10 flex items-center select-none shadow-md">
      {/* Label Badge */}
      <div className="bg-pine-btn border border-pine-border text-[11px] font-button font-bold text-pine-text-heading px-3 py-1 ml-4 rounded-md uppercase tracking-wider flex items-center gap-1.5 z-20 shadow-lg">
        <Bell className="w-3.5 h-3.5 text-pine-success animate-pulse" />
        Announcements
      </div>

      {/* Infinite scrolling viewport */}
      <div className="ticker-wrap flex-1 pointer-events-auto">
        <div className="ticker-content text-sm font-sans tracking-wide flex gap-12 items-center">
          <span>{announcementText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span>{announcementText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span>{announcementText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span>{announcementText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        </div>
      </div>
    </div>
  );
}
