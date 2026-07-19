import { Link } from 'react-router-dom';

const KYCBanner = ({ status }) => {
  if (!status || status === 'approved') return null;

  if (status === 'pending') {
    return (
      <div className="bg-warning/10 border border-warning/30 rounded-brand p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-triangle-exclamation text-warning text-lg flex-shrink-0" />
          <p className="text-sm text-[#92400e]">Your KYC verification is pending. Complete it to start receiving bookings.</p>
        </div>
        <Link to="/teacher/kyc" className="bg-warning text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition whitespace-nowrap">
          Complete KYC
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-error/10 border border-error/30 rounded-brand p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        <i className="fa-solid fa-circle-xmark text-error text-lg flex-shrink-0" />
        <p className="text-sm text-red-700">Your KYC was rejected. Please review and resubmit your documents.</p>
      </div>
      <Link to="/teacher/kyc" className="bg-error text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition whitespace-nowrap">
        Resubmit KYC
      </Link>
    </div>
  );
};
export default KYCBanner;
