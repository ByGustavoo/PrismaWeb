import { Hammer } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout';

interface UnderConstructionProps {
  title: string;
  description: string;
  /** O que esta tela vai fazer quando estiver pronta. */
  plannedFor: string;
}

/** Placeholder consistente para as telas que serao construidas nas proximas etapas. */
export function UnderConstruction({ title, description, plannedFor }: UnderConstructionProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card padding="none">
        <EmptyState icon={Hammer} title="Em desenvolvimento" description={plannedFor} />
      </Card>
    </>
  );
}
