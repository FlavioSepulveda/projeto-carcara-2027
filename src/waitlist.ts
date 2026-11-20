import emailjs from '@emailjs/browser';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { firestore } from './firebase';

export const ADMIN_EMAIL = 'diceforgecontato@gmail.com';

const EMAILJS_CONFIG = {
  serviceId: 'service_3tysjop',
  templateId: 'template_4xhhtnq',
  publicKey: 's4NDoPP7DasqGyIBT',
};

export interface LicenseRequest {
  id: string;
  artistName: string;
  email: string;
  city: string;
  specialty: string;
  portfolioUrl: string;
  statement: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
}

const REQUESTS_COL = collection(firestore, 'license_requests');

/** Grava a inscrição na fila global do Firestore */
export async function submitRealWaitlist(
  data: Omit<LicenseRequest, 'id' | 'status' | 'createdAt'>
): Promise<LicenseRequest> {
  const cleanEmail = data.email.trim().toLowerCase();
  const ref = doc(firestore, 'license_requests', cleanEmail);
  const snap = await getDoc(ref);

  const currentStatus =
    snap.exists() && snap.data().status === 'approved' ? 'approved' : 'pending';

  const payload = {
    artistName: data.artistName.trim(),
    email: cleanEmail,
    city: data.city.trim(),
    specialty: data.specialty,
    portfolioUrl: data.portfolioUrl.trim(),
    statement: data.statement.trim(),
    status: currentStatus,
    createdAt: snap.exists() && snap.data().createdAt ? snap.data().createdAt : serverTimestamp(),
  };

  await setDoc(ref, payload, { merge: true });
  return { id: cleanEmail, ...payload } as LicenseRequest;
}

/** Verifica se o e-mail está na fila ou já foi aprovado como Beta Tester */
export async function checkWaitlistStatus(email: string): Promise<LicenseRequest | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const snap = await getDoc(doc(firestore, 'license_requests', cleanEmail));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as LicenseRequest;
}

/** Verifica se o lançamento geral foi aberto (documento config/app -> publicLaunch: true) */
export async function isPublicLaunchEnabled(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(firestore, 'config', 'app'));
    return snap.exists() && snap.data().publicLaunch === true;
  } catch {
    return false;
  }
}

/** Busca todos os inscritos na fila e ordena por data de chegada */
export async function listAllWaitlistRequests(): Promise<LicenseRequest[]> {
  const snap = await getDocs(REQUESTS_COL);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LicenseRequest));
  return items.sort((a, b) => {
    const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return tA - tB;
  });
}

/** Aprova o beta tester no Firestore e envia o e-mail automático de boas-vindas com o PDF da Licença */
export async function approveBetaTester(
  email: string
): Promise<{ emailSent: boolean; errorMsg?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const ref = doc(firestore, 'license_requests', cleanEmail);
  const snap = await getDoc(ref);
  const artistName = snap.exists() ? snap.data().artistName : cleanEmail.split('@')[0];

  await updateDoc(ref, { status: 'approved', approvedAt: serverTimestamp() });

  if (!EMAILJS_CONFIG.templateId || !EMAILJS_CONFIG.publicKey) {
    return {
      emailSent: false,
      errorMsg: 'Configure templateId e publicKey no src/waitlist.ts',
    };
  }

  const pdfUrl = `${window.location.origin}/Licenca-Artista-Carcara-v1.pdf`;
  try {
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      {
        to_email: cleanEmail,
        artist_name: artistName,
        license_pdf_url: pdfUrl,
      },
      { publicKey: EMAILJS_CONFIG.publicKey }
    );
    return { emailSent: true };
  } catch (err: any) {
    const detail = err?.text || err?.message || JSON.stringify(err);
    console.error('Erro EmailJS:', detail);
    return { emailSent: false, errorMsg: detail };
  }
}