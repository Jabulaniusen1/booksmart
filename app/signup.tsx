import { router } from 'expo-router';
import { useEffect } from 'react';

export default function SignupRedirect() {
  useEffect(() => {
    // Redirect to the new basic signup page
    router.replace('/signup-basic');
  }, []);

  return null;
}
