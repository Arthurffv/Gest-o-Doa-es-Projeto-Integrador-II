import { ROTULO_STATUS } from '../labels';
import type { StatusItem } from '../types';

export default function StatusChip({ status }: { status: StatusItem }) {
  return <span className={`status status-${status.toLowerCase()}`}>{ROTULO_STATUS[status]}</span>;
}
