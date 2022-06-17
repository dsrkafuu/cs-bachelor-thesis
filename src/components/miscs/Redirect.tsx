import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface RedirectProps {
  path: string;
}

function Redirect({ path }: RedirectProps) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(path);
  }, [navigate, path]);

  return null;
}

export default Redirect;
