import {MarqueeText} from './MarqueeText';

const MESSAGES = [
  'Sewn to order in north London',
  'Complimentary mending, for life',
  'Made slowly, in small batches',
  'Now accepting commissions for spring',
];

export function AnnouncementBar() {
  return (
    <div
      className="bg-ink text-cream/90 overflow-hidden"
      style={{height: 'var(--announcement-height)'}}
    >
      <div className="flex h-full items-center">
        <MarqueeText items={MESSAGES} />
      </div>
    </div>
  );
}
