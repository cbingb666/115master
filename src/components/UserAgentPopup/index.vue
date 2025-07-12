<template>
  <Teleport to="body">
    <div v-if="visible" class="user-agent-popup-overlay" @click="close">
      <div class="user-agent-popup" @click.stop>
        <div class="user-agent-popup-header">
          <h3>115Master 提示</h3>
          <button class="close-button" @click="close">
            ×
          </button>
        </div>
        <div class="popup-main">
          <div class="popup-content">
            <div class="content-icon">
              <span class="number-icon">1</span>
            </div>
            <div class="content-text">
              <p>现在不需要 User-Agent Switcher and Manager 插件了</p>
              <p>
                快卸载掉他吧~
              </p>
              <p>
                然后刷新下页面，复活我~
              </p>
            </div>
          </div>
          <div class="popup-desc">
            <p>当前的 User-Agent</p>
            <div class="user-agent-box">
              {{ userAgent }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<(e: 'update:visible', value: boolean) => void>()

const userAgent = ref(navigator.userAgent)

function close() {
  emit('update:visible', false)
}
</script>

<style scoped>
.user-agent-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
}

.popup-main {
  padding: 0 24px 24px;
}

.user-agent-popup {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 550px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  animation: popup-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.user-agent-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eaeaea;
}

.user-agent-popup-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  line-height: 1;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-button:hover {
  color: #333;
  background-color: #f5f5f5;
}

.popup-content {
  margin: 24px 0;
  display: flex;
  align-items: flex-start;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
}

.content-icon {
  margin-right: 16px;
  color: #2196f3;
  flex-shrink: 0;
}

.number-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: #2196f3;
  color: white;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
}

.content-text {
  flex: 1;
}

.content-text p {
  line-height: 1.6;
  margin: 0;
  margin-bottom: 8px;
  color: #444;
}

.content-text p:last-child {
  margin-bottom: 0;
}

.popup-desc {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-top: 24px;
}

.popup-desc p {
  margin: 0 0 8px;
  font-weight: 500;
}

.user-agent-box {
  background-color: #f5f5f5;
  border-radius: 6px;
  padding: 12px;
  font-size: 12px;
  color: #666;
  word-break: break-all;
  text-align: left;
  font-family: monospace;
  border: 1px solid #eaeaea;
}

a {
  color: #2196f3;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

a:hover {
  color: #0d6efd;
  text-decoration: underline;
}

@keyframes popup-fade-in {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
