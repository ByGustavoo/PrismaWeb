import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button, Card, EmptyState } from '@/components/ui';
import { paths } from '@/routes/paths';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Card padding="none">
      <EmptyState
        icon={Compass}
        title="Página não encontrada"
        description="O endereço acessado não existe ou foi movido."
        action={
          <Button variant="secondary" onClick={() => navigate(paths.dashboard)}>
            Voltar ao dashboard
          </Button>
        }
      />
    </Card>
  );
}
