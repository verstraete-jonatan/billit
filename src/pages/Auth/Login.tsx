import { Button } from "@heroui/react";
import { PropsWithChildren, useContext } from "react";
import { AuthContext } from "src/providers/AuthProvider";
import { Home } from "../Home";

import imgGoogle from "../../assets/google.png";

export const Login = ({ children }: PropsWithChildren) => {
  const { user, loading, signInWithGoogle } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="w-screen h-screen">
        <Home title={loading ? "Loading.." : "Billit"}>
          <Button
            color="primary"
            onPress={signInWithGoogle}
            disabled={!signInWithGoogle}
            isLoading={loading}
            size="lg"
            className="w-fit"
          >
            Login with google
            <img src={imgGoogle} className="w-8 h-8" />
          </Button>
        </Home>
      </div>
    );
  }

  return <>{children}</>;
};
