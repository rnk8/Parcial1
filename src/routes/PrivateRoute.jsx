import { useAuthState } from 'react-firebase-hooks/auth';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';

const PrivateRoute = ({ children }) => {
  const [user] = useAuthState(auth);
  
  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
