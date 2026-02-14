import SignedInHeader from "./SignedInHeader";
import SignedOutHeader from "./SignedOutHeader";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { isAuthenticated, loading, user } = useAuth();

  // show a spinner while checking auth status
  if (loading) {
    return (
      <div className="fixed top-0 left-0 w-full h-[70px] z-50 flex items-center justify-center bg-white dark:bg-gray-900 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // if authenticated, render the SignedInHeader
  if (isAuthenticated) {
    return <SignedInHeader user={user} />;
  }

  // otherwise, render the SignedOutHeader
  return <SignedOutHeader />;
}
