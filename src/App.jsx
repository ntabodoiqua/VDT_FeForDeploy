import { Outlet } from "react-router-dom";
import Header from "./components/layout/header";
import { useContext, useEffect } from "react"
import { AuthContext } from "./components/context/auth.context";
import { Spin } from "antd";
import { jwtDecode } from 'jwt-decode';

function App() {

  const { setAuth, appLoading, setAppLoading } = useContext(AuthContext);

  useEffect(() => {
    setAppLoading(true);
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setAuth({
          isAuthenticated: true,
          username: decoded.sub
        });
      } catch (e) {
        setAuth({
          isAuthenticated: false,
          username: ''
        });
      }
    } else {
      setAuth({
        isAuthenticated: false,
        username: ''
      });
    }
    setAppLoading(false);
  }, []);

  return (
    <div>
      {appLoading === true ?
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        }}>

          <Spin />

        </div>
        :
        <>
          <Header />
          <Outlet />
        </>
      }

    </div>
  )
}

export default App
