import { Navigate, useParams } from 'react-router-dom';
import { selectReportById, useDemo } from '../../store/demoStore';
import DraftView from './DraftView';
import NewReport from './NewReport';

export default function ReportsPage() {
  const { id } = useParams();
  const report = useDemo(selectReportById(id));
  if (!id) return <NewReport />;
  if (!report) return <Navigate to="/app/reports/new" replace />;
  return <DraftView key={report.id} report={report} />;
}
