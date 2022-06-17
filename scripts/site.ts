import 'dotenv/config';
import process from 'process';
import { prompt } from 'enquirer';
import { validateDomain } from '../lib/utils';
import { connect } from '../db/connect';
import { SiteModel, UserModel } from '../db/models';
import logger from '../lib/logger';

const invalidDomain = () => {
  console.log('无效的域名');
};

/**
 * create a site for a user
 */
async function main() {
  const { username } = (await prompt({
    type: 'input',
    name: 'username',
    message: '请输入所属用户名',
  })) as { username: string };
  const user = await UserModel.findOne({ username });
  if (!user) {
    console.log('用户不存在');
    process.exit(1);
  }

  const { name } = (await prompt({
    type: 'input',
    name: 'name',
    message: '请输入站点名',
  })) as { name: string };
  const { domain } = (await prompt({
    type: 'input',
    name: 'domain',
    message: '请输入站点域名',
  })) as { domain: string };
  if (!validateDomain(domain)) {
    invalidDomain();
    process.exit(1);
  }
  const { base } = (await prompt({
    type: 'input',
    name: 'base',
    message: '请输入站点基础路径 (为空时默认为 /)',
  })) as { base: string };

  const site = await SiteModel.create({
    name,
    domain,
    baseURL: base.trim() || undefined,
    _user: user._id,
  });
  await user.save();
  logger.info(
    'site',
    'site created',
    {
      auth: 'server command',
      _id: site._id,
      name: site.name,
    },
    () => process.exit(0)
  );
  console.log(`站点 ${site.name} 创建成功，ID ${site._id}`);
}

connect()
  .then(main)
  .catch((e: any) => {
    console.error(e);
    process.exit(1);
  });
