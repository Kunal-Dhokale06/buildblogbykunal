document.addEventListener('DOMContentLoaded', () => {
  // Enforce dark mode and clean up any legacy theme preference
  try {
    localStorage.removeItem('agentguard-theme');
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
  document.body.classList.remove('light-theme');
  document.body.classList.add('dark-theme');

  initReadingProgressBar();
  initScrollSpy();
  initMobileMenu();
  initBackToTop();
  initCommentsAndRatings();
});

/**
 * 1. Reading Progress Bar
 */
function initReadingProgressBar() {
  const progressBar = document.getElementById('reading-progress-bar');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) return;
    const progress = (window.scrollY / totalHeight) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }, { passive: true });
}

/**
 * 2. ScrollSpy for Top Nav and Sticky TOC
 */
function initScrollSpy() {
  const navLinks = document.querySelectorAll('.nav-desktop .nav-link');
  const tocLinks = document.querySelectorAll('.toc-list a');
  const sections = document.querySelectorAll('article[id], section[id]');

  if (!sections.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '-80px 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        
        // Update Header Main Part Links
        if (id.startsWith('part-') || id === 'post-intro' || id === 'comments-section') {
          navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }

        // Update TOC Links
        tocLinks.forEach(tocLink => {
          if (tocLink.getAttribute('href') === `#${id}`) {
            tocLink.classList.add('active');
          } else {
            // Only remove if it's the specific match
            if (tocLink.getAttribute('href').replace('#', '') === id) {
              tocLink.classList.remove('active');
            }
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

/**
 * 3. Mobile Menu Toggle
 */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('nav-mobile');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!menuBtn || !mobileNav) return;

  menuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
    });
  });
}

/**
 * 4. Back to Top Button
 */
function initBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * 5. Interactive Blog Comments & Star Rating System
 */
function initCommentsAndRatings() {
  const STORAGE_KEY = 'buildlog_kunal_comments_v1';
  const LIKED_KEY = 'buildlog_kunal_liked_ids';

  // Seed baseline comments from peers and readers
  const DEFAULT_COMMENTS = [
    {
      id: 'comment_1',
      author: 'Alex Rivera',
      role: 'Platform Engineer @ ScaleOps',
      rating: 5,
      content: 'The section on Docker Model Runner dynamic GPU unloading hit right at home. We were burning $4k/month on idle Ollama instances for dev agents. Sandboxing each agent run while sharing the model weights is the exact pattern the industry needs. Super clean breakdown Kunal!',
      avatarColor: '#6366f1',
      createdAt: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
      displayTime: '2 days ago',
      likes: 24,
      replies: [
        {
          id: 'reply_1_1',
          author: 'Kunal',
          role: 'Author',
          content: 'Thanks Alex! Exactly why I wrote this—saving both the security blast radius and the cloud bill makes adopting agents viable.',
          avatarColor: '#f59e0b',
          displayTime: '1 day ago'
        }
      ]
    },
    {
      id: 'comment_2',
      author: 'Dr. Elena Rostova',
      role: 'Sandboxing & Security Researcher',
      rating: 5,
      content: 'Fantastic emphasis on why prompts are merely suggestions whereas engineering constraints (cgroups, namespaces, gVisor) enforce real boundaries. The comparison between full VMs, containers, and microVM sandboxes should be required reading for anyone deploying autonomous coding agents.',
      avatarColor: '#06b6d4',
      createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      displayTime: '1 day ago',
      likes: 19,
      replies: []
    },
    {
      id: 'comment_3',
      author: 'Marcus Chen',
      role: 'Senior DevOps Architect',
      rating: 5,
      content: 'Loved the visual diagrams and practical walkthrough of Docker Sandboxes. Never realized YOLO mode was so rampant in local dev until I saw colleagues running unchecked pip installs in agents. Great work!',
      avatarColor: '#10b981',
      createdAt: Date.now() - 1000 * 60 * 60 * 16, // 16 hours ago
      displayTime: '16 hours ago',
      likes: 11,
      replies: []
    },
    {
      id: 'comment_4',
      author: 'Priya Sharma',
      role: 'Fullstack & LLM Developer',
      rating: 4,
      content: 'Really insightful article! The distinction between standard containers and ephemeral agent sandboxes cleared up a lot of misconceptions. Would love a follow-up on networking isolation policies with eBPF!',
      avatarColor: '#a855f7',
      createdAt: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
      displayTime: '6 hours ago',
      likes: 8,
      replies: []
    }
  ];

  // Load from local storage or initialize
  let comments = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      comments = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Storage read failed', err);
  }

  if (!comments || !Array.isArray(comments) || comments.length === 0) {
    comments = DEFAULT_COMMENTS;
    saveComments(comments);
  }

  let likedIds = new Set();
  try {
    const likedRaw = localStorage.getItem(LIKED_KEY);
    if (likedRaw) {
      likedIds = new Set(JSON.parse(likedRaw));
    }
  } catch (err) {
    console.warn('Liked storage read failed', err);
  }

  function saveComments(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Storage save error', err);
    }
  }

  function saveLikes() {
    try {
      localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(likedIds)));
    } catch (err) {
      console.warn('Storage save error', err);
    }
  }

  // DOM Elements
  const form = document.getElementById('blog-comment-form');
  const authorInput = document.getElementById('comment-author');
  const roleInput = document.getElementById('comment-role');
  const bodyInput = document.getElementById('comment-body');
  const ratingInput = document.getElementById('selected-rating');
  const starButtons = document.querySelectorAll('#star-picker .star-btn');
  const starLabel = document.getElementById('rating-score-label');
  const colorDots = document.querySelectorAll('#avatar-color-picker .color-dot');
  const quickTags = document.querySelectorAll('.quick-tag-chip');
  const charCounter = document.getElementById('comment-char-count');
  const previewAvatar = document.getElementById('author-preview-avatar');
  const previewName = document.getElementById('author-preview-name');
  const statusBanner = document.getElementById('comment-form-status');
  const commentsList = document.getElementById('comments-list-container');
  const sortPills = document.querySelectorAll('#sort-controls .sort-pill');
  const resetBtn = document.getElementById('btn-reset-comments');

  let currentRating = 5;
  let currentColor = '#6366f1';
  let currentSort = 'newest';

  const ratingDescriptions = {
    1: '⭐ 1 / 5 - Needs improvement',
    2: '⭐⭐ 2 / 5 - Fair read',
    3: '⭐⭐⭐ 3 / 5 - Good and informative',
    4: '⭐⭐⭐⭐ 4 / 5 - Very helpful & well-explained',
    5: '⭐⭐⭐⭐⭐ 5 / 5 - Masterpiece! Outstanding 🚀'
  };

  // 1. Interactive Star Rating Picker
  function updateStarsVisual(rating) {
    starButtons.forEach(btn => {
      const val = parseInt(btn.getAttribute('data-value'), 10);
      if (val <= rating) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    if (starLabel && ratingDescriptions[rating]) {
      starLabel.textContent = ratingDescriptions[rating];
    }
  }

  starButtons.forEach(btn => {
    const val = parseInt(btn.getAttribute('data-value'), 10);

    btn.addEventListener('mouseenter', () => {
      starButtons.forEach(b => {
        const bVal = parseInt(b.getAttribute('data-value'), 10);
        if (bVal <= val) {
          b.classList.add('hovered');
        } else {
          b.classList.remove('hovered');
        }
      });
      if (starLabel && ratingDescriptions[val]) {
        starLabel.textContent = ratingDescriptions[val];
      }
    });

    btn.addEventListener('mouseleave', () => {
      starButtons.forEach(b => b.classList.remove('hovered'));
      updateStarsVisual(currentRating);
    });

    btn.addEventListener('click', () => {
      currentRating = val;
      if (ratingInput) ratingInput.value = val;
      updateStarsVisual(currentRating);
    });
  });

  // 2. Avatar live preview & Color Picker
  if (authorInput) {
    authorInput.addEventListener('input', () => {
      const val = authorInput.value.trim();
      if (previewName) {
        previewName.textContent = val || 'Reader';
      }
      if (previewAvatar) {
        previewAvatar.textContent = val ? val.charAt(0).toUpperCase() : 'R';
      }
    });
  }

  colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      colorDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      currentColor = dot.getAttribute('data-color') || '#6366f1';
      if (previewAvatar) {
        previewAvatar.style.backgroundColor = currentColor;
      }
    });
  });

  // 3. Quick Tag Chips
  quickTags.forEach(chip => {
    chip.addEventListener('click', () => {
      const tag = chip.getAttribute('data-tag');
      if (!bodyInput) return;
      const current = bodyInput.value;
      if (current.includes(tag)) return;
      bodyInput.value = current ? `${current.trim()}\n[Tag: ${tag}]` : `[Tag: ${tag}] `;
      bodyInput.focus();
      updateCharCount();
    });
  });

  // 4. Character Counter
  function updateCharCount() {
    if (!bodyInput || !charCounter) return;
    const len = bodyInput.value.length;
    charCounter.textContent = `${len} / 1000`;
  }
  if (bodyInput) {
    bodyInput.addEventListener('input', updateCharCount);
  }

  // 5. Form Submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const authorName = authorInput.value.trim();
      const roleText = roleInput.value.trim() || 'Reader & Builder';
      const commentText = bodyInput.value.trim();

      if (!authorName) {
        showStatus('Please enter your name.', 'error');
        authorInput.focus();
        return;
      }

      if (!commentText) {
        showStatus('Please write your thoughts or question.', 'error');
        bodyInput.focus();
        return;
      }

      const newComment = {
        id: 'comment_' + Date.now(),
        author: authorName,
        role: roleText,
        rating: currentRating,
        content: commentText,
        avatarColor: currentColor,
        createdAt: Date.now(),
        displayTime: 'Just now',
        likes: 0,
        replies: []
      };

      // Add to comments list
      comments.unshift(newComment);
      saveComments(comments);

      // Render updated list
      renderComments(newComment.id);
      updateRatingDashboard();

      // Clear form inputs
      form.reset();
      currentRating = 5;
      updateStarsVisual(5);
      if (authorInput) authorInput.value = '';
      if (roleInput) roleInput.value = '';
      if (bodyInput) bodyInput.value = '';
      updateCharCount();
      if (previewName) previewName.textContent = 'Reader';
      if (previewAvatar) {
        previewAvatar.textContent = 'R';
        previewAvatar.style.backgroundColor = currentColor;
      }

      showStatus('🎉 Thank you! Your review and rating have been posted below.', 'success');

      // Scroll smoothly to the newly posted comment
      setTimeout(() => {
        const newCard = document.getElementById(newComment.id);
        if (newCard) {
          newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    });
  }

  function showStatus(message, type) {
    if (!statusBanner) return;
    statusBanner.className = `form-status-banner ${type}`;
    statusBanner.textContent = message;
    statusBanner.style.display = 'flex';

    setTimeout(() => {
      statusBanner.style.display = 'none';
    }, 5000);
  }

  // 6. Sorting Controls
  sortPills.forEach(pill => {
    pill.addEventListener('click', () => {
      sortPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentSort = pill.getAttribute('data-sort') || 'newest';
      renderComments();
    });
  });

  // 7. Reset Comments Demo
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset to initial community reviews and clear added comments?')) {
        comments = DEFAULT_COMMENTS;
        likedIds.clear();
        saveComments(comments);
        saveLikes();
        renderComments();
        updateRatingDashboard();
        showStatus('Reset completed. Original reviews restored.', 'success');
      }
    });
  }

  // Render & Calculation Helpers
  function getSortedComments() {
    const list = [...comments];
    if (currentSort === 'highest') {
      return list.sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt);
    } else if (currentSort === 'popular') {
      return list.sort((a, b) => b.likes - a.likes || b.createdAt - a.createdAt);
    }
    // Default newest
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  function updateRatingDashboard() {
    const totalCount = comments.length;
    let avg = 5.0;
    if (totalCount > 0) {
      const sum = comments.reduce((acc, c) => acc + (c.rating || 5), 0);
      avg = (sum / totalCount).toFixed(1);
    }

    // Update Average Display
    const avgDisplay = document.getElementById('rating-average-display');
    if (avgDisplay) avgDisplay.textContent = avg;

    // Update Stars Large
    const starsLarge = document.getElementById('rating-stars-summary');
    if (starsLarge) {
      const fullStars = Math.round(parseFloat(avg));
      starsLarge.textContent = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
      starsLarge.setAttribute('aria-label', `Rating: ${avg} out of 5 stars`);
    }

    // Update Counts
    const totalCountEl = document.getElementById('rating-total-count');
    if (totalCountEl) totalCountEl.textContent = totalCount;

    const displayCountEl = document.getElementById('comments-display-count');
    if (displayCountEl) displayCountEl.textContent = totalCount;

    // Hero Badge Summary
    const heroSummary = document.getElementById('hero-rating-summary');
    if (heroSummary) {
      heroSummary.innerHTML = `<strong>${avg}</strong> (${totalCount} review${totalCount === 1 ? '' : 's'})`;
    }

    // Navigation & TOC count badges
    document.querySelectorAll('.comment-count-badge, #toc-comment-count').forEach(el => {
      el.textContent = totalCount;
    });

    // Breakdown Bars
    for (let s = 1; s <= 5; s++) {
      const count = comments.filter(c => c.rating === s).length;
      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      const fillBar = document.getElementById(`bar-fill-${s}`);
      const countEl = document.getElementById(`bar-count-${s}`);
      if (fillBar) fillBar.style.width = `${pct}%`;
      if (countEl) countEl.textContent = count;
    }
  }

  function renderComments(highlightId = null) {
    if (!commentsList) return;
    const sorted = getSortedComments();

    if (sorted.length === 0) {
      commentsList.innerHTML = `
        <div class="comment-card" style="text-align: center; color: var(--text-secondary); padding: 40px;">
          <p>No comments yet. Be the first to rate and review this post!</p>
        </div>
      `;
      return;
    }

    commentsList.innerHTML = sorted.map(c => {
      const isLiked = likedIds.has(c.id);
      const isHighlight = c.id === highlightId;
      const initial = (c.author || 'U').charAt(0).toUpperCase();
      const stars = '★'.repeat(c.rating || 5);
      const isAuthor = (c.author || '').toLowerCase() === 'kunal';

      const repliesHtml = (c.replies && c.replies.length > 0)
        ? `<div class="replies-container">
            ${c.replies.map(r => `
              <div class="reply-card">
                <div class="reply-header">
                  <div class="reply-avatar" style="background-color: ${r.avatarColor || '#6366f1'};">
                    ${(r.author || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span class="reply-author">
                    ${escapeHtml(r.author)}
                    ${r.author.toLowerCase() === 'kunal' ? '<span class="role-badge author-badge-indicator">Author</span>' : ''}
                  </span>
                  <span class="reply-time">${escapeHtml(r.displayTime || 'Recently')}</span>
                </div>
                <div class="reply-text">${escapeHtml(r.content)}</div>
              </div>
            `).join('')}
          </div>`
        : '';

      return `
        <article class="comment-card ${isHighlight ? 'just-added' : ''}" id="${c.id}">
          <div class="comment-card-header">
            <div class="comment-author-wrap">
              <div class="comment-avatar" style="background-color: ${c.avatarColor || '#6366f1'};">
                ${initial}
              </div>
              <div class="comment-author-meta">
                <div class="comment-author-name">
                  ${escapeHtml(c.author)}
                  ${isAuthor ? '<span class="role-badge author-badge-indicator">Author</span>' : ''}
                  ${c.role ? `<span class="role-badge">${escapeHtml(c.role)}</span>` : ''}
                </div>
                <span class="comment-timestamp">${escapeHtml(c.displayTime || 'Recently')}</span>
              </div>
            </div>

            <div class="comment-rating-badge" title="Rated ${c.rating} out of 5 stars">
              <span class="comment-stars">${stars}</span>
              <span>${c.rating}.0</span>
            </div>
          </div>

          <div class="comment-content">${escapeHtml(c.content)}</div>

          <div class="comment-footer-actions">
            <button type="button" class="btn-action-like ${isLiked ? 'liked' : ''}" data-comment-id="${c.id}" aria-label="Like comment">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span class="like-count">${c.likes || 0}</span>
            </button>

            <button type="button" class="btn-action-reply" data-comment-id="${c.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Reply
            </button>
          </div>

          <div class="reply-form-slot" id="reply-slot-${c.id}"></div>
          ${repliesHtml}
        </article>
      `;
    }).join('');

    attachCommentActions();
  }

  function attachCommentActions() {
    // Like buttons
    document.querySelectorAll('.btn-action-like').forEach(btn => {
      btn.addEventListener('click', () => {
        const commentId = btn.getAttribute('data-comment-id');
        const target = comments.find(c => c.id === commentId);
        if (!target) return;

        if (likedIds.has(commentId)) {
          likedIds.delete(commentId);
          target.likes = Math.max(0, (target.likes || 1) - 1);
        } else {
          likedIds.add(commentId);
          target.likes = (target.likes || 0) + 1;
        }

        saveComments(comments);
        saveLikes();

        // Update button visual
        const isLiked = likedIds.has(commentId);
        btn.classList.toggle('liked', isLiked);
        const countSpan = btn.querySelector('.like-count');
        if (countSpan) countSpan.textContent = target.likes;
      });
    });

    // Reply buttons
    document.querySelectorAll('.btn-action-reply').forEach(btn => {
      btn.addEventListener('click', () => {
        const commentId = btn.getAttribute('data-comment-id');
        const slot = document.getElementById(`reply-slot-${commentId}`);
        if (!slot) return;

        // Toggle existing
        if (slot.innerHTML.trim() !== '') {
          slot.innerHTML = '';
          return;
        }

        slot.innerHTML = `
          <div class="reply-form-inline">
            <div class="reply-inputs-row">
              <input type="text" class="form-input reply-input-sm" id="reply-name-${commentId}" placeholder="Your Name" maxlength="40">
              <input type="text" class="form-input reply-input-sm" id="reply-role-${commentId}" placeholder="Role / Title (optional)" maxlength="50">
            </div>
            <textarea class="reply-textarea" id="reply-text-${commentId}" placeholder="Write a response..." rows="2" maxlength="400"></textarea>
            <div class="reply-form-actions">
              <button type="button" class="btn-cancel-reply" data-comment-id="${commentId}">Cancel</button>
              <button type="button" class="btn-send-reply" data-comment-id="${commentId}">Send Reply</button>
            </div>
          </div>
        `;

        const nameInput = document.getElementById(`reply-name-${commentId}`);
        const textInput = document.getElementById(`reply-text-${commentId}`);
        const cancelBtn = slot.querySelector('.btn-cancel-reply');
        const sendBtn = slot.querySelector('.btn-send-reply');

        if (nameInput) nameInput.focus();

        cancelBtn.addEventListener('click', () => {
          slot.innerHTML = '';
        });

        sendBtn.addEventListener('click', () => {
          const rName = nameInput.value.trim();
          const rText = textInput.value.trim();

          if (!rName || !rText) {
            alert('Please enter your name and a reply message.');
            return;
          }

          const target = comments.find(c => c.id === commentId);
          if (target) {
            if (!target.replies) target.replies = [];
            target.replies.push({
              id: 'reply_' + Date.now(),
              author: rName,
              content: rText,
              avatarColor: '#10b981',
              displayTime: 'Just now'
            });

            saveComments(comments);
            renderComments();
          }
        });
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial render
  updateStarsVisual(5);
  updateRatingDashboard();
  renderComments();
}


