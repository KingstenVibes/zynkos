const SUPABASE_URL = 'https://supabase.co';
const SUPABASE_KEY = 'sb_publishable_7jeUPiNJ85hfdzEei1vdQA__bqEY_kD';
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
  toggleBtn.textContent = isSignup ? 'Have an Account? Sign In' : 'Create Account';
  userInp.classList.toggle('hidden', !isSignup);
};

submitBtn.onclick = async () => {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-pass').value;
  const username = userInp.value.trim();

  if (isSignup) {
    if (!username) return alert('Please choose a username.');
    const { data, error } = await window.sb.auth.signUp({ email, password });
    if (error) return alert(error.message);
    if (data.user) {
      await window.sb.from('users').insert({
        id: data.user.id,
        username,
        avatar: `https://dicebear.com{encodeURIComponent(username)}`,
        role: username.toLowerCase() === 'kingstenvibes' ? 'FOUNDER' : 'MEMBER'
      });
    }
  } else {
    const { error } = await window.sb.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
  }
  authModal.classList.add('hidden');
};

window.refreshMyProfile = async function() {
  if (!window.currentUser) return;
  const { data } = await window.sb.from('users').select('*').eq('id', window.currentUser.id).single();
  if (data) {
    window.userProfile = data;
    window.dispatchEvent(new Event('zynk-profile-updated'));
  }
};

window.sb.auth.onAuthStateChange(async (_event, session) => {
  window.currentUser = session?.user || null;
  const btn = document.getElementById('top-auth-btn');
  if (!window.currentUser) {
    window.userProfile = null;
    btn.textContent = 'Sign In / Create Account';
    window.dispatchEvent(new Event('zynk-profile-updated'));
    return;
  }
  btn.textContent = 'Sign Out';
  await window.sb.from('users').update({ online: true }).eq('id', window.currentUser.id);
  await window.refreshMyProfile();
});

window.addEventListener('beforeunload', () => {
  if (window.currentUser) {
    window.sb.from('users').update({ online: false }).eq('id', window.currentUser.id);
  }
});
