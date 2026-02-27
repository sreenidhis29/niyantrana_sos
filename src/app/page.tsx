import { HUDLayout } from '@/components/HUD/HUDLayout';
import { TacticalMap } from '@/components/Map/TacticalMap';

export default function Home() {
  return (
    <main>
      <HUDLayout>
        <TacticalMap />
      </HUDLayout>
    </main>
  );
}
