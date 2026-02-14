import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "./components/Sidebar";

export default function Profile() {
  return (
    <>
      <Header />
      <Sidebar>
        <Outlet />
      </Sidebar>
    </>
  );
}
