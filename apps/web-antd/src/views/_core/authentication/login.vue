<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';

import { computed } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

// // 快速登录滑块状态
// const quickLoginSlider = ref(false);
// const quickLoginLoading = ref(false);

// 快速登录函数
// const handleQuickLogin = async () => {
//   if (quickLoginSlider.value) {
//     quickLoginLoading.value = true;
//     try {
//       await authStore.authLogin({
//         username: 'admin',
//         password: 'admin123'
//       });
//     } catch (error) {
//       console.error('快速登录失败:', error);
//     } finally {
//       quickLoginLoading.value = false;
//     }
//   }
// };

// 滑块交互逻辑
// const handleSliderStart = (event: MouseEvent | TouchEvent) => {
//   event.preventDefault();
  
//   const track = event.currentTarget as HTMLElement;
//   const thumb = track.querySelector('.slider-thumb') as HTMLElement;
  
//   const handleMove = (e: MouseEvent | TouchEvent) => {
//     const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
//     const trackRect = track.getBoundingClientRect();
//     const thumbWidth = thumb.offsetWidth;
//     const trackWidth = trackRect.width - thumbWidth;
    
//     const percentage = Math.max(0, Math.min(1, (clientX - trackRect.left - thumbWidth / 2) / trackWidth));
    
//     if (percentage > 0.8) {
//       quickLoginSlider.value = true;
//       thumb.style.transform = `translateX(${trackWidth}px)`;
//     } else {
//       quickLoginSlider.value = false;
//       thumb.style.transform = `translateX(${percentage * trackWidth}px)`;
//     }
//   };
  
//   const handleEnd = () => {
//     document.removeEventListener('mousemove', handleMove);
//     document.removeEventListener('mouseup', handleEnd);
//     document.removeEventListener('touchmove', handleMove);
//     document.removeEventListener('touchend', handleEnd);
//   };
  
//   document.addEventListener('mousemove', handleMove);
//   document.addEventListener('mouseup', handleEnd);
//   document.addEventListener('touchmove', handleMove);
//   document.addEventListener('touchend', handleEnd);
// };

const MOCK_USER_OPTIONS: BasicOption[] = [
  {
    label: 'Super',
    value: 'vben',
  },
  {
    label: 'Admin',
    value: 'admin',
  },
  {
    label: 'User',
    value: 'jack',
  },
];

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenSelect',
      componentProps: {
        options: MOCK_USER_OPTIONS,
        placeholder: $t('authentication.selectAccount'),
      },
      fieldName: 'selectAccount',
      label: $t('authentication.selectAccount'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.selectAccount') })
        .optional()
        .default('admin'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      dependencies: {
        trigger(values, form) {
          if (values.selectAccount) {
            const findUser = MOCK_USER_OPTIONS.find(
              (item) => item.value === values.selectAccount,
            );
            if (findUser) {
              form.setValues({
                password: findUser.value === 'admin' ? 'admin123' : '123456',
                username: findUser.value,
              });
            }
          }
        },
        triggerFields: ['selectAccount'],
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    }
  ];
});
</script>

<template>
   <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="authStore.authLogin"
  />
</template>

<style scoped>

</style>
