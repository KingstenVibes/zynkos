const SUPABASE_URL = 'https://supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbHlibW56c3B2eXJ1end3Z2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyOTkzMDQsImV4cCI6MjExMDg3NTMwNH0.E2pZaS0OGtkEk6hfsMSOJ2MUu8i-iZyAHnEKg-RhnH0';

const rememberPref = localStorage.getItem('zynkos_remember') !== 'false';
window.sb = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: rememberPref, storage: rememberPref ? window.localStorage : window.sessionStorage }
    })
  : null;

window.currentUser = null;
window.userProfile = null;

const authModal = document.getElementById('auth-modal');
const userInp = document.getElementById('auth-user');
const submitBtn = document.getElementById('auth-submit-btn');
const toggleBtn = document.getElementById('auth-toggle-btn');
const remBox = document.getElementById('remember-me');
if (remBox) remBox.checked = rememberPref;
let isSignup = false;

document.getElementById('top-auth-btn').onclick = async () => {
  if (window.currentUser && window.sb) {
    await window.sb.from('users').update({ online: false }).eq('id', window.currentUser.id);
    await window.sb.auth.signOut();
  }
  authModal.classList.remove('hidden');
};
document.getElementById('auth-close-btn').onclick = () => authModal.classList.add('hidden');

toggleBtn.onclick = () => {
  isSignup = !isSignup;
  document.getElementById('auth-title').textContent = isSignup ? 'Create ZynkOS Account' : 'ZynkOS // System Access';
  submitBtn.textContent = isSignup ? 'Create Account & Boot' : 'Boot Into ZynkOS';
  toggleBtn.textContent = isSignup ? 'Have an Account? Switch to Sign In' : 'Need an account? Switch to Create Account';
  userInp.classList.toggle('hidden', !isSignup);
};

async function ensureProfile(user, preferredName) {
  let { data } = await window.sb.from('users').select('*').eq('id', user.id).maybeSingle();
  if (!data) {
    const uname = preferredName || user.email.split('@')[0];
    const isFounder = uname.toLowerCase() === 'kingstenvibes';
    const { data: inserted, error } = await window.sb.from('users').insert({
      id: user.id,
      username: uname,
      avatar: `https://dicebear.com{encodeURIComponent(uname)}`,
      role: isFounder ? 'FOUNDER' : 'MEMBER',
      is_beta: isFounder
    }).select().single();
    if (error) alert('Profile DB error: ' + error.message);
    data = inserted;
  }
  return data;
}

submitBtn.onclick = async () => {
  if (!window.sb) return alert('Supabase failed to load—check network filter.');
  if (remBox) localStorage.setItem('zynkos_remember', remBox.checked ? 'true' : 'false');
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-pass').value;
  const username = userInp.value.trim();
  if (!email || !password) return alert('Enter both email and password.');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Connecting...';
  try {
    if (isSignup) {
      if (!username) return alert('Please enter a username.');
      const { data, error } = await window.sb.auth.signUp({ email, password });
      if (error) return alert(error.message);
      if (!data.session) {
        return alert('Account created! Turn OFF "Confirm email" in Supabase -> Authentication -> Sign In / Up, then click Sign In.');
      }
      await ensureProfile(data.user, username);
    } else {
      const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
      if (error) return alert(error.message);
      if (data.user) await ensureProfile(data.user, username || 'KingstenVibes');
    }
    authModal.classList.add('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isSignup ? 'Create Account & Boot' : 'Boot Into ZynkOS';
  }
};

window.refreshMyProfile = async function() {
  if (!window.currentUser || !window.sb) return;
  const data = await ensureProfile(window.currentUser);
  if (data) {
    window.userProfile = data;
    const isFounder = data.role === 'FOUNDER';
    const isBeta = data.is_beta || isFounder;
    document.getElementById('nav-admin-btn')?.classList.toggle('hidden', !isFounder);
    document.getElementById('nav-beta-btn')?.classList.toggle('hidden', !isBeta);
    window.dispatchEvent(new Event('zynk-profile-updated'));
  }
};

if (window.sb) {
  window.sb.auth.onAuthStateChange(async (_event, session) => {
    window.currentUser = session?.user || null;
    const btn = document.getElementById('top-auth-btn');
    if (!window.currentUser) {
      window.userProfile = null;
      btn.textContent = 'Sign In';
      document.getElementById('nav-admin-btn')?.classList.add('hidden');
      document.getElementById('nav-beta-btn')?.classList.add('hidden');
      window.dispatchEvent(new Event('zynk-profile-updated'));
      return;
    }
    btn.textContent = 'Sign Out';
    authModal.classList.add('hidden');
    await window.refreshMyProfile();
    await window.sb.from('users').update({ online: true }).eq('id', window.currentUser.id);
  });
}
