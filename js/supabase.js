const SUPABASE_URL = 'https://supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbHlibW56c3B2eXJ1end3Z2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyOTkzMDQsImV4cCI6MjExMDg3NTMwNH0.E2pZaS0OGtkEk6hfsMSOJ2MUu8i-iZyAHnEKg-RhnH0';
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.currentUser = null;
window.userProfile = null;

const authModal = document.getElementById('auth-modal');
const userInp = document.getElementById('auth-user');
const submitBtn = document.getElementById('auth-submit-btn');
const toggleBtn = document.getElementById('auth-toggle-btn');
let isSignup = false;

document.getElementById('top-auth-btn').onclick = async () => {
  if (window.currentUser) {
    await window.sb.from('users').update({ online: false }).eq('id', window.currentUser.id);
    await window.sb.auth.signOut();
  } else {
    authModal.classList.remove('hidden');
  }
};
document.getElementById('auth-close-btn').onclick = () => authModal.classList.add('hidden');

toggleBtn.onclick = () => {
  isSignup = !isSignup;
  document.getElementById('auth-title').textContent = isSignup ? 'Create ZynkOS Account' : 'Sign In to ZynkOS';
  submitBtn.textContent = isSignup ? 'Create Account' : 'Sign In';
  toggleBtn.textContent = isSignup ? 'Have an Account? Switch to Sign In' : 'Need an account? Switch to Create Account';
  userInp.classList.toggle('hidden', !isSignup);
};

submitBtn.onclick = async () => {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-pass').value;
  const username = userInp.value.trim();
  submitBtn.disabled = true;

  try {
    if (isSignup) {
      if (!username) return alert('Please choose a username.');
      const { data, error } = await window.sb.auth.signUp({ email, password });
      if (error) return alert(error.message);
      if (data.user) {
        const isFounder = username.toLowerCase() === 'kingstenvibes';
        await window.sb.from('users').insert({
          id: data.user.id,
          username,
          avatar: `https://dicebear.com{encodeURIComponent(username)}`,
          role: isFounder ? 'FOUNDER' : 'MEMBER',
          is_beta: isFounder
        });
      }
    } else {
      const { error } = await window.sb.auth.signInWithPassword({ email, password });
      if (error) return alert(error.message);
    }
    authModal.classList.add('hidden');
  } finally {
    submitBtn.disabled = false;
  }
};

window.refreshMyProfile = async function() {
  if (!window.currentUser) return;
  const { data } = await window.sb.from('users').select('*').eq('id', window.currentUser.id).single();
  if (data) {
    window.userProfile = data;
    const isFounder = data.role === 'FOUNDER';
    const isBeta = data.is_beta || isFounder;
    document.getElementById('nav-admin-btn')?.classList.toggle('hidden', !isFounder);
    document.getElementById('nav-beta-btn')?.classList.toggle('hidden', !isBeta);
    window.dispatchEvent(new Event('zynk-profile-updated'));
  }
};

window.sb.auth.onAuthStateChange(async (_event, session) => {
  window.currentUser = session?.user || null;
  const btn = document.getElementById('top-auth-btn');
  if (!window.currentUser) {
    window.userProfile = null;
    btn.textContent = 'Sign In / Create Account';
    document.getElementById('nav-admin-btn')?.classList.add('hidden');
    document.getElementById('nav-beta-btn')?.classList.add('hidden');
    window.dispatchEvent(new Event('zynk-profile-updated'));
    return;
  }
  btn.textContent = 'Sign Out';
  await window.sb.from('users').update({ online: true }).eq('id', window.currentUser.id);
  await window.refreshMyProfile();
});
