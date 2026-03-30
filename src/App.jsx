import { GLOBAL_CSS } from "./shared/constants.js";
import ClientApp  from "./client/ClientApp.jsx";
import ManagerApp from "./manager/ManagerApp.jsx";

export default function App() {
  const isManager = new URLSearchParams(window.location.search).get("view") === "manager";
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {isManager ? <ManagerApp /> : <ClientApp />}
    </>
  );
}
