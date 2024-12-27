  "use client";
  import { useState } from 'react';

  export default function Home() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const register = async () => {
      const res = await fetch('http://localhost:3001/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      alert(data.message);
    };

    function base64urlToArrayBuffer(base64urlString: string) {
      const base64 = base64urlString.replace(/-/g, '+').replace(/_/g, '/');
      const binaryString = atob(base64);
      const binaryLength = binaryString.length;
      const bytes = new Uint8Array(binaryLength);
      for (let i = 0; i < binaryLength; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }


    const enableWebAuthn = async () => {
      const res = await fetch('http://localhost:3001/webauthn/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const { publicKey } = await res.json();

      // Convert challenge to ArrayBuffer
      publicKey.challenge = base64urlToArrayBuffer(publicKey.challenge);

      // Convert user ID if required
      publicKey.user.id = base64urlToArrayBuffer(publicKey.user.id);

      const credential = await navigator.credentials.create({ publicKey });
      await fetch('http://localhost:3001/webauthn/register/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      });
      alert('WebAuthn enabled');
    };


    const loginWithPassword = async () => {
      const res = await fetch('http://localhost:3001/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      alert(data.message);
    };

    const loginWithWebAuthn = async () => {
      const res = await fetch('http://localhost:3001/webauthn/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
    
      const { publicKey } = await res.json();
    
      // Convert challenge to ArrayBuffer
      publicKey.challenge = base64urlToArrayBuffer(publicKey.challenge);
    
      // Convert each allowCredentials.id to ArrayBuffer
      publicKey.allowCredentials.forEach((cred: PublicKeyCredentialDescriptor) => {
        cred.id = new Uint8Array(base64urlToArrayBuffer(cred.id));
      });
    
      const assertion = await navigator.credentials.get({ publicKey });
    
      await fetch('http://localhost:3001/webauthn/login/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assertion),
      });
    
      alert('Logged in with WebAuthn');
    };
    

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-sm w-full">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">WebAuthn Example</h1>
          <div className="space-y-4">
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:outline-none"
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:outline-none"
            />
            <button
              onClick={register}
              className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring focus:ring-blue-300 focus:outline-none"
            >
              Register
            </button>
            <button
              onClick={enableWebAuthn}
              className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring focus:ring-green-300 focus:outline-none"
            >
              Enable WebAuthn
            </button>
            <button
              onClick={loginWithPassword}
              className="w-full py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:ring focus:ring-yellow-300 focus:outline-none"
            >
              Login with Password
            </button>
            <button
              onClick={loginWithWebAuthn}
              className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:ring focus:ring-purple-300 focus:outline-none"
            >
              Login with WebAuthn
            </button>
          </div>
        </div>
      </div>

    );
  }
