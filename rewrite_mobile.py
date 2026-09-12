import os

file_path = r"d:\Downloads\SE Project\Growary\mobile\src\screens\BossEventScreen.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Interfaces
content = content.replace(
"""    startTime: string;
    endTime: string;""",
"""    startTime?: string;
    endTime?: string;
    weekActivatedAt?: string;"""
)

# 2. State
content = content.replace(
"""    // Data state
    const [boss, setBoss] = useState<ActiveBoss | null>(null);
    const [record, setRecord] = useState<BossRecord | null>(null);""",
"""    // Data state
    const [bosses, setBosses] = useState<ActiveBoss[]>([]);
    const [records, setRecords] = useState<BossRecord[]>([]);
    const [attackBossId, setAttackBossId] = useState<string | null>(null);
    const [activeStoryBoss, setActiveStoryBoss] = useState<ActiveBoss | null>(null);"""
)

# 3. Fetch data
fetch_old = """            const res = await apiService.get('/events/boss/active');
            if (res.activeBoss) {
                setBoss(res.activeBoss);
                setRecord(res.userRecord);

                // Show StoryModal if unlocked and HP = 0 and not seen
                if (res.userRecord?.hasUnlockedStory && res.activeBoss?.currentHp === 0) {
                    const key = `story_seen_${res.activeBoss._id}`;
                    const seen = await AsyncStorage.getItem(key);
                    if (!seen) {
                        setIsStoryModalVisible(true);
                        await AsyncStorage.setItem(key, 'true');
                    }
                }
            }"""
fetch_new = """            const res = await apiService.get('/events/boss/active');
            if (res.activeBosses && res.activeBosses.length > 0) {
                setBosses(res.activeBosses);
                setRecords(res.userRecords || []);

                for (let i = 0; i < res.activeBosses.length; i++) {
                    const b = res.activeBosses[i];
                    const r = res.userRecords?.[i];
                    if (r?.hasUnlockedStory && b.currentHp <= 0) {
                        const key = `story_seen_${b._id}`;
                        const seen = await AsyncStorage.getItem(key);
                        if (!seen) {
                            setActiveStoryBoss(b);
                            setIsStoryModalVisible(true);
                            await AsyncStorage.setItem(key, 'true');
                            break;
                        }
                    }
                }
            } else {
                setBosses([]);
                setRecords([]);
            }"""
content = content.replace(fetch_old, fetch_new)

# 4. handleAttackPress
attack_press_old = """    const handleAttackPress = async () => {
        if (!record || record.attackPoints <= 0) return;

        const hasQuiz = boss?.miniGameQuestions && boss.miniGameQuestions.length > 0;
        const options = hasQuiz ? ['tap', 'quiz', 'reflex'] : ['tap', 'reflex'];

        let selectedType = options[Math.floor(Math.random() * options.length)] as 'tap' | 'quiz' | 'reflex';
        if (boss?.miniGameType && boss.miniGameType !== 'random') {
            selectedType = boss.miniGameType as 'tap' | 'quiz' | 'reflex';
            if (selectedType === 'quiz' && !hasQuiz) selectedType = 'tap'; // Fallback if admin set quiz but no questions
        }"""
attack_press_new = """    const handleAttackPress = async (targetBoss: ActiveBoss, targetRecord: BossRecord) => {
        if (!targetRecord || targetRecord.attackPoints <= 0) return;
        setAttackBossId(targetBoss._id);

        const hasQuiz = targetBoss.miniGameQuestions && targetBoss.miniGameQuestions.length > 0;
        const options = hasQuiz ? ['tap', 'quiz', 'reflex'] : ['tap', 'reflex'];

        let selectedType = options[Math.floor(Math.random() * options.length)] as 'tap' | 'quiz' | 'reflex';
        if (targetBoss.miniGameType && targetBoss.miniGameType !== 'random') {
            selectedType = targetBoss.miniGameType as 'tap' | 'quiz' | 'reflex';
            if (selectedType === 'quiz' && !hasQuiz) selectedType = 'tap';
        }"""
content = content.replace(attack_press_old, attack_press_new)

# 5. handleMiniGameComplete API call
mini_old = """            const body: any = {
                miniGameType,
                miniGameResult: result,
                usePercentage: attackPercentage
            };"""
mini_new = """            const body: any = {
                bossId: attackBossId,
                miniGameType,
                miniGameResult: result,
                usePercentage: attackPercentage
            };"""
content = content.replace(mini_old, mini_new)

# 6. Null check boss -> bosses array check
null_check_old = """    if (!boss) {
        return (
            <View style={styles.container}>
                <ClayHeader user={user} />
                <View style={[styles.header, { paddingTop: 10 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={20} color="rgba(93, 64, 55, 0.6)" />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="security" size={64} color={COLORS.clayText} />
                    <Text style={{ marginTop: 16, fontSize: 18, color: COLORS.clayText, fontWeight: 'bold' }}>
                        Không có sự kiện Mở Khóa Nhân Vật nào đang diễn ra!
                    </Text>
                </View>
            </View>
        );
    }

    const hpPercent = Math.max(0, Math.min(100, (boss.currentHp / boss.maxHp) * 100));

    const getTimeLeftText = () => {
        if (!boss.endTime) return "HOT EVENT";
        const diff = new Date(boss.endTime).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days > 0) return `CÒN ${days} NGÀY`;
        if (days === 0) return "CÒN < 24 GIỜ";
        return "SẮP TIÊU DIỆT";
    };

    const isBossDefeated = boss.currentHp <= 0;
    const currentAttackPower = record ? Math.floor(record.attackPoints * attackPercentage) : 0;"""
null_check_new = """    if (bosses.length === 0) {
        return (
            <View style={styles.container}>
                <ClayHeader user={user} />
                <View style={[styles.header, { paddingTop: 10 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={20} color="rgba(93, 64, 55, 0.6)" />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <MaterialIcons name="security" size={64} color={COLORS.clayText} />
                    <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.clayText, fontWeight: 'bold', textAlign: 'center' }}>
                        Tuần này chưa có Nhân Vật xuất hiện. Hãy chờ đến tuần sau nhé!
                    </Text>
                </View>
            </View>
        );
    }

    const getWeekLabel = (boss: ActiveBoss) => {
        if (!boss.weekActivatedAt) return "HOT EVENT";
        const d = new Date(boss.weekActivatedAt);
        const dEnd = new Date(d);
        dEnd.setDate(dEnd.getDate() + 6);
        return `W${getWeekNumber(d)} (${d.getDate()}/${d.getMonth()+1} - ${dEnd.getDate()}/${dEnd.getMonth()+1})`;
    };

    const getWeekNumber = (d: Date): number => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
        return weekNo;
    };"""
content = content.replace(null_check_old, null_check_new)

# 7. Timer Badge wrapper -> Static text wrapper
timer_old = """                <View style={styles.timerBadge}>
                    <MaterialIcons name="timer" size={20} color={COLORS.clayAccent2} />
                    <Text style={styles.timerText}>{getTimeLeftText()}</Text>
                </View>"""
timer_new = """                <View style={styles.timerBadge}>
                    <MaterialIcons name="calendar-today" size={20} color={COLORS.clayAccent2} />
                    <Text style={styles.timerText}>{getWeekLabel(bosses[0])}</Text>
                </View>"""
content = content.replace(timer_old, timer_new)

# 8. Render Bosses List
start_marker = "{/* Event Banner */}"
end_marker = "{/* Collections Section */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    section_to_wrap = content[start_idx:end_idx]
    
    # Remove old computed constants that we moved into the map
    section_to_wrap = section_to_wrap.replace("const hpPercent = Math.max(0, Math.min(100, (boss.currentHp / boss.maxHp) * 100));\n", "")
    section_to_wrap = section_to_wrap.replace("const isBossDefeated = boss.currentHp <= 0;\n", "")
    section_to_wrap = section_to_wrap.replace("const currentAttackPower = record ? Math.floor(record.attackPoints * attackPercentage) : 0;\n", "")
    
    wrapped_section = (
        "{\n"
        "    bosses.map((boss, index) => {\n"
        "        const record = records[index];\n"
        "        const hpPercent = Math.max(0, Math.min(100, (boss.currentHp / boss.maxHp) * 100));\n"
        "        const isBossDefeated = boss.currentHp <= 0;\n"
        "        const currentAttackPower = record ? Math.floor(record.attackPoints * attackPercentage) : 0;\n"
        "        return (\n"
        "            <View key={boss._id} style={{ marginBottom: 40 }}>\n"
    ) + section_to_wrap + (
        "            </View>\n"
        "        );\n"
        "    })\n"
        "}\n"
    ) + end_marker
    
    content = content[:start_idx] + wrapped_section + content[end_idx + len(end_marker):]

# 9. HandleAttackPress call inside the mapped section
content = content.replace("onPress={handleAttackPress}", "onPress={() => handleAttackPress(boss, record)}")
content = content.replace("onPress={() => setIsStoryModalVisible(true)}", "onPress={() => { setActiveStoryBoss(boss); setIsStoryModalVisible(true); }}")

# 10. Update StoryUnlockModal boss prop
content = content.replace("""            <StoryUnlockModal
                visible={isStoryModalVisible}
                boss={boss}
                isInCollection={!!boss.collectionId}""",
"""            <StoryUnlockModal
                visible={isStoryModalVisible}
                boss={activeStoryBoss || bosses[0]}
                isInCollection={!!(activeStoryBoss?.collectionId)}""")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
