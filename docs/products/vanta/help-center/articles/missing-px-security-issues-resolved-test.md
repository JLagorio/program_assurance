# Missing Px security issues resolved test

Source: https://help.vanta.com/en/articles/11345705-missing-px-security-issues-resolved-test
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

When an administrator notices they have some but not all of the Px Security issues resolved tests showing up on their Vanta instance, this may lead to some confusion and worry. This is usually not a bug as these test are auto-enabled once we detect a task from your task tracker with the appropriate tag. Note PX can be p0, p1, p2, and p3.

## How to enable the missing Px security issues resolved test
If you notice you are missing the P0 security issues resolved test, this just means we have yet to pull in a task from your task tracker with that priority. You can either wait until you have an actual task that is of that priority created, or you can create a new task in your task tracker with the 'P0' priority tag and once Vanta detects this, the test will appear in your instance.

The same steps can be done for the P1, P2, and P3 security issues resolved tests. This is the only way for the test to appear in your instance, it is not possible for Vanta staff to enable it for you.

## What if I have tasks with the appropriate Px tag
If you missing the P1 security issues resolved test for example and in your task tracker you notice you have tasks created after the date when you originally connected your task tracker to Vanta with the P1 priority; please ensure you or another admin did not deactivate the test. You can see deactivated test by going to the All deactivated test category on the test page:
​
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758840/9500bc08da9cca6ef0d5104bffc7/25027367806228?expires=1794967200&signature=c3d00fe3ba0fc7e00c944c111ea527d4bf30eecf50a2f0e8e049fcec09e52760&req=dSUmEM57lYlbWfMW1HO4zRnho1wjU1Cs2v1mM3zKECGF1LlTPjBm%2BL%2F9%2FG3K%0AUh1jIv%2F70YhXLRB5vMU%3D%0A>
We also suggest going to one of the the test that are active and exporting the test data:
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758843/973165ddc9cae169f67efee127d1/upload_9847129381514546028?expires=1794967200&signature=b316148d0de184e3ee7a3dd7bfb4813131cca085848d31e92e31f84dfc95034a&req=dSUmEM57lYlbWvMW1HO4zQs6h6oY8rU8FDRcAuIy%2B1GwsVlrPxlKTEG0G6S5%0AlvcKgmfy37GxN6A6GqE%3D%0A>
From the CSV provided please search for and confirm you see a task with a P1 priority. The CSV will list all tasks we are fetching from your task tracker. If you do not any listed with the P1 priority you would need to create one in order to have the P1 security issues resolved test enabled.
If you do see a task with the P1 priority, you should screenshot this and screenshot the task in your task tracker and write into [email protected].  Note these steps can be done for any of the missing P0, P1, P2 and P3 security issues resolved test.

## Images

- [image 01] ../../images/ux/tests/missing-px-security-issues-resolved-test--01.png
- [image 02] ../../images/ux/tests/missing-px-security-issues-resolved-test--02.png
