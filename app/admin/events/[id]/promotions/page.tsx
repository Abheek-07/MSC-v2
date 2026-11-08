import PromotionsClient from './PromotionsClient';

export default async function EventPromotionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PromotionsClient eventId={id} />;
}
