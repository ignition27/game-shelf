// Run every browser suite and report all failures, so one failure cannot hide another.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const suites=['arcade','shooter','vault','rewards','golf','integration','cosmetics','daily','cup'];
const failed=[];
for(const suite of suites){
  console.log(`\nTesting ${suite}…`);
  const result=spawnSync(process.execPath,[path.join(__dirname,`${suite}.cjs`)],{stdio:'inherit',env:process.env,timeout:180000});
  if(result.error)console.error(result.error.message);
  if(result.status!==0)failed.push(suite);
}
if(failed.length){console.error(`\nFailed: ${failed.join(', ')}`);process.exitCode=1;}
else console.log(`\nAll ${suites.length} browser suites passed.`);
