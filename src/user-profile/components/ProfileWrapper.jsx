import ProfileInfoForm from "./ProfileInfoForm";
import DangerZoneSection from "./DangerZoneSection";

export default function ProfileWrapper() {
  return (
    <section className="flex flex-col gap-8">
      <ProfileInfoForm />
      <DangerZoneSection />
    </section>
  );
}
