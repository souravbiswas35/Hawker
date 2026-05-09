import { FiFilePlus } from "react-icons/fi";
import PageTitle from "../../components/common/PageTitle";
import LicenseApplication from "../../components/license/LicenseApplication";
import VendorLayout from "../../components/layout/VendorLayout";

export default function VendorApplyPage() {
  return (
    <VendorLayout>
      <PageTitle
        title="Apply for License"
        subtitle="Complete your 6-step vendor license application"
        icon={FiFilePlus}
        className="mb-4"
      />
      <LicenseApplication />
    </VendorLayout>
  );
}
