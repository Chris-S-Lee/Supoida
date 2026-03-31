import { GLOBAL_CSS } from "./shared/constants.js";
import ClientApp  from "./client/ClientApp.jsx";
import ManagerApp from "./manager/ManagerApp.jsx";

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const isManager = params.get("view") === "manager";

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {isManager ? <ManagerApp /> : <ClientApp />}
    </>
  );
}