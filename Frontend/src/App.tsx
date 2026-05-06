
import AppRouter from './app/routes/AppRouter';
import { AuthProvider } from './app/providers/AuthContext';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
