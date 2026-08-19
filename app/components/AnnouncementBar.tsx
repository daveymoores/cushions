import {MarqueeText} from './MarqueeText';
import {useSiteContent} from '~/lib/content';

const FALLBACK_MESSAGES = [
  'Made from deadstock fabric',
  'Sewn in small batches in Amsterdam',
  'Filled with feather inserts, finished by hand',
  'Once a fabric is gone, it’s gone',
];

export function AnnouncementBar() {
  const content = useSiteContent();
  const messages = content.announcement
    ? content.announcement
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    : FALLBACK_MESSAGES;

  return (
    <div
      className="bg-ink text-paper/75 overflow-hidden"
      style={{height: 'var(--announcement-height)'}}
    >
      <div className="flex h-full items-center">
        <MarqueeText items={messages} />
      </div>
    </div>
  );
}
