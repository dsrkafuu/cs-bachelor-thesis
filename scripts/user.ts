import 'dotenv/config';
import process from 'process';
import { prompt } from 'enquirer';
import { validatePassword, validateUsername } from '../lib/utils';
import { hashPassword } from '../lib/crypto';
import { connect } from '../db/connect';
import { UserModel } from '../db/models';
import logger from '../lib/logger';

const invalidUsername = () => {
  console.log('无效的用户名，请使用字母、数字、连字符和下划线');
  console.log('用户名长度应在 5-20 字符之间且以字母开头');
};
const invalidPassword = () => {
  console.log('无效的密码，请使用字母、数字、连字符、下划线和 !@#$%^&* 等符号');
  console.log('密码长度应在 6-50 字符之间');
};

/**
 * init a user or reset password
 */
async function main() {
  const { work } = (await prompt({
    type: 'select',
    name: 'work',
    message: '请选择操作',
    choices: ['初始化用户', '重置用户密码'],
  })) as { work: string };
  const { username } = (await prompt({
    type: 'input',
    name: 'username',
    message: '请输入用户名',
  })) as { username: string };
  if (!validateUsername(username)) {
    invalidUsername();
    process.exit(1);
  }

  let user: any = null;
  if (work === '重置用户密码') {
    user = await UserModel.findOne({ username });
    if (!user) {
      console.log('用户不存在');
      process.exit(1);
    }
  }

  const { password } = (await prompt({
    type: 'password',
    name: 'password',
    message: '请输入密码',
  })) as { password: string };
  if (!validatePassword(password)) {
    invalidPassword();
    process.exit(1);
  }

  if (work === '重置用户密码') {
    user.password = await hashPassword(password);
    await user.save();
    console.log(`密码重置成功，用户 ID ${user._id}`);
    logger.info(
      'user',
      `user password reset`,
      { auth: 'server command', username, id: user._id },
      () => process.exit(0)
    );
  } else {
    const { role } = (await prompt({
      type: 'select',
      name: 'role',
      message: '请选择用户角色',
      choices: ['admin', 'user'],
    })) as { role: string };
    const user = await UserModel.findOneAndUpdate(
      {
        username,
      },
      {
        username,
        password: await hashPassword(password),
        role,
      },
      {
        new: true,
        upsert: true,
        rawResult: true,
      }
    ).lean();
    if (user.value) {
      console.log(
        `初始化用户 ${user.value.username} 成功，ID ${user.value._id}`
      );
      logger.info(
        'site',
        'user created',
        {
          auth: 'server command',
          username: user.value.username,
          id: user.value._id,
        },
        () => process.exit(0)
      );
    } else {
      logger.error(
        'site',
        'user create failed',
        { auth: 'server command', username },
        () => process.exit(0)
      );
      console.log(`初始化用户 ${username} 失败`);
    }
  }
}

connect()
  .then(main)
  .catch((e: any) => {
    console.error(e);
    process.exit(1);
  });
