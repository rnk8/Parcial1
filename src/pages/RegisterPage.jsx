import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '../firebase-confing/Firebase';

const RegisterPage = () => {
  const [user, setUser] = useState('');
  const [correo, setCorreo] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Obtener la instancia de auth
  const auth = getAuth(app);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, correo, pass);
      console.log("User registered:", userCredential.user);
      navigate('/');  // Navegar después de registrar al usuario
    } catch (error) {
      console.error("Registration error:", error);
      setError("Error al registrar usuario: " + error.message);  // Mostrar el mensaje de error completo
    }
  };

  return (
    <>
      <div className="text-center mt-24">
        <div className="flex items-center justify-center">
          <svg fill="none" viewBox="0 0 24 24" className="w-12 h-12 text-blue-500" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-4xl tracking-tight">Registrarse</h2>
        <span className="text-sm">o <a href="/login" className="text-blue-500">Iniciar Sesión</a></span>
      </div>

      <div className="flex justify-center my-2 mx-4 md:mx-0">
        <form onSubmit={handleRegister} className="w-full max-w-xl bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full px-3 mb-6">
              <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">Nombre Completo</label>
              <input className="appearance-none block w-full bg-white text-gray-900 font-medium border border-gray-400 rounded-lg py-3 px-3 leading-tight focus:outline-none" type="text" required value={user} onChange={(e) => setUser(e.target.value)} />
            </div>
            <div className="w-full px-3 mb-6">
              <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">Correo Electrónico</label>
              <input className="appearance-none block w-full bg-white text-gray-900 font-medium border border-gray-400 rounded-lg py-3 px-3 leading-tight focus:outline-none" type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
            </div>
            <div className="w-full px-3 mb-6">
              <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">Contraseña</label>
              <input className="appearance-none block w-full bg-white text-gray-900 font-medium border border-gray-400 rounded-lg py-3 px-3 leading-tight focus:outline-none" type="password" required value={pass} onChange={(e) => setPass(e.target.value)} />
            </div>

            {/* Mostrar mensaje de error si ocurre */}
            {error && <p className="text-red-500 text-xs italic">{error}</p>}

            <div className="w-full px-3 mb-6">
              <button className="appearance-none block w-full bg-blue-600 text-gray-100 font-bold border border-gray-200 rounded-lg py-3 px-3 leading-tight hover:bg-blue-500 focus:outline-none">Registrarse</button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default RegisterPage;
