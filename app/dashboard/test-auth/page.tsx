'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, XCircle, Loader2, LogOut } from 'lucide-react';

export default function TestAuthPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAuth() {
      try {
        // 1. Test Récupération Session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        setSessionInfo(session);

        if (session?.user) {
          // 2. Test Lecture Base de Données (Table Profiles)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;
          setProfileInfo(profile);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    verifyAuth();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090B] text-[#FAFAFA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#EF4444]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] p-8 text-[#FAFAFA]">
      <div className="mx-auto max-w-2xl rounded-xl border border-[#27272A] bg-[#18181B] p-6 space-y-6">
        <h1 className="text-xl font-bold">Vérification de Connexion GestFiPro</h1>

        {/* État de Session */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-[#09090B] border border-[#27272A]">
          <div>
            <p className="text-sm font-medium">Session Supabase Active</p>
            <p className="text-xs text-[#A1A1AA]">{sessionInfo?.user?.email || 'Non connecté'}</p>
          </div>
          {sessionInfo ? (
            <CheckCircle2 className="text-green-500 w-6 h-6" />
          ) : (
            <XCircle className="text-[#EF4444] w-6 h-6" />
          )}
        </div>

        {/* État du Profil DB */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-[#09090B] border border-[#27272A]">
          <div>
            <p className="text-sm font-medium">Profil Utilisateur (Table `profiles`)</p>
            <p className="text-xs text-[#A1A1AA]">
              {profileInfo ? `ID: ${profileInfo.id}` : 'Aucun profil trouvé'}
            </p>
          </div>
          {profileInfo ? (
            <CheckCircle2 className="text-green-500 w-6 h-6" />
          ) : (
            <XCircle className="text-[#EF4444] w-6 h-6" />
          )}
        </div>

        {error && (
          <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444] rounded text-xs text-[#EF4444]">
            Erreur détectée : {error}
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <a href="/dashboard" className="text-xs text-[#A1A1AA] hover:text-white underline">
            Retour au Dashboard
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-[#EF4444] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-red-600 transition"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
