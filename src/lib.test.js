import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAccountId,isWin,summarize} from './lib.js';
test('Steam formats resolve to the same account',()=>{
 for(const value of ['86745912','76561198047011640','https://steamcommunity.com/profiles/76561198047011640/','STEAM_0:0:43372956']) assert.equal(parseAccountId(value),'86745912');
});
test('invalid, vanity and out of range IDs are rejected',()=>{for(const v of ['0','-1','abc','https://steamcommunity.com/id/test','76561197960265727','4294967296'])assert.throws(()=>parseAccountId(v));});
test('wins respect Radiant and Dire player slots',()=>{assert.equal(isWin({player_slot:0,radiant_win:true}),true);assert.equal(isWin({player_slot:128,radiant_win:false}),true);assert.equal(isWin({player_slot:128,radiant_win:true}),false);});
test('summary handles empty history and zero deaths',()=>{assert.equal(summarize([]).kda,'—');assert.deepEqual(summarize([{player_slot:128,radiant_win:false,kills:2,deaths:0,assists:5,gold_per_min:500,xp_per_min:600}]),{count:1,wins:1,winrate:100,kda:'7.00',gpm:500,xpm:600});});
