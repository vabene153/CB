import { PrismaClient, UserStatus, ProjectStatus, EquipmentStatus, TimeEntryStatus, DailyReportWeather, KanbanColumnKey } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ein Demo-Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'musterbau' },
    update: {},
    create: {
      name: 'Musterbau GmbH',
      slug: 'musterbau',
      isActive: true,
      street: 'Bauweg 10',
      postalCode: '10115',
      city: 'Berlin',
      country: 'Deutschland',
      phone: '+49 30 1112220',
      email: 'info@musterbau.de',
      billingName: 'Musterbau GmbH Buchhaltung',
      billingStreet: 'Rechnungsweg 5',
      billingPostalCode: '10117',
      billingCity: 'Berlin',
      billingCountry: 'Deutschland',
      notes: 'Demo-Mandant für Tests.',
    },
  });

  await prisma.tenantContact.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.tenantContact.createMany({
    data: [
      { tenantId: tenant.id, firstName: 'Anna', lastName: 'Baumann', role: 'Geschäftsführung', phone: '+49 30 1112221', email: 'anna.baumann@musterbau.de', isPrimary: true, order: 1 },
      { tenantId: tenant.id, firstName: 'Marco', lastName: 'Keller', role: 'Bauleiter', phone: '+49 30 1112222', mobile: '+49 171 1234567', email: 'marco.keller@musterbau.de', isPrimary: false, order: 2 },
      { tenantId: tenant.id, firstName: 'Julia', lastName: 'Schmidt', role: 'Buchhaltung', phone: '+49 30 1112223', email: 'julia.schmidt@musterbau.de', isPrimary: false, order: 3 },
    ],
  });

  // Rollen
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      label: 'Administrator',
    },
  });

  const projectManagerRole = await prisma.role.upsert({
    where: { name: 'PROJECT_MANAGER' },
    update: {},
    create: {
      name: 'PROJECT_MANAGER',
      label: 'Bauleiter',
    },
  });

  // einfache Berechtigungen
  const permissions = await Promise.all(
    [
      { key: 'projects.read', label: 'Projekte ansehen' },
      { key: 'projects.write', label: 'Projekte bearbeiten' },
      { key: 'equipment.read', label: 'Fuhrpark ansehen' },
      { key: 'time.read', label: 'Zeiten ansehen' },
      { key: 'time.write', label: 'Zeiten erfassen' },
    ].map((p) =>
      prisma.permission.upsert({
        where: { key: p.key },
        update: {},
        create: p,
      }),
    ),
  );

  // Verbinde ADMIN mit allen Rechten
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  const passwordHash = await bcrypt.hash('Passwort123!', 10);

  // Demo-User admin@musterbau.de
  const adminUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@musterbau.de',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@musterbau.de',
      password: passwordHash,
      firstName: 'Anna',
      lastName: 'Baumann',
      status: UserStatus.ACTIVE,
      phone: '+49 30 1234567',
      position: 'Geschäftsführung',
      isSuperAdmin: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // zweiter Beispieluser (Bauleiter)
  const managerUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'bauleiter@musterbau.de',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'bauleiter@musterbau.de',
      password: await bcrypt.hash('Bauleiter123!', 10),
      firstName: 'Marco',
      lastName: 'Keller',
      status: UserStatus.ACTIVE,
      position: 'Bauleiter',
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: managerUser.id,
        roleId: projectManagerRole.id,
      },
    },
    update: {},
    create: {
      userId: managerUser.id,
      roleId: projectManagerRole.id,
    },
  });

  // Kunden & Kontakte
  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Wohnbau Nord AG',
      type: 'Gewerblicher Kunde',
      street: 'Hauptstraße 12',
      postalCode: '10115',
      city: 'Berlin',
      phone: '+49 30 7654321',
      email: 'info@wohnbau-nord.de',
      notes: 'Schwerpunkt Mehrfamilienhäuser.',
      createdById: adminUser.id,
    },
  });

  const contact = await prisma.customerContact.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      firstName: 'Julia',
      lastName: 'Schneider',
      role: 'Einkauf',
      phone: '+49 30 9876543',
      email: 'j.schneider@wohnbau-nord.de',
    },
  });

  // Projekte
  const project = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      name: 'Neubau Wohnanlage Prenzlauer Allee',
      description: 'Wohnanlage mit 48 Wohneinheiten und Tiefgarage.',
      street: 'Prenzlauer Allee 220',
      postalCode: '10405',
      city: 'Berlin',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date(),
      progressPercent: 35,
      projectManagerId: managerUser.id,
      foremanId: adminUser.id,
    },
  });

  // Projektphasen
  await prisma.projectPhase.createMany({
    data: [
      {
        tenantId: tenant.id,
        projectId: project.id,
        name: 'Planung und Genehmigung',
        order: 1,
      },
      {
        tenantId: tenant.id,
        projectId: project.id,
        name: 'Rohbau',
        order: 2,
      },
      {
        tenantId: tenant.id,
        projectId: project.id,
        name: 'Ausbau',
        order: 3,
      },
    ],
    skipDuplicates: true,
  });

  // Nutzer dem Projekt zuordnen
  await prisma.projectUserAssignment.createMany({
    data: [
      {
        tenantId: tenant.id,
        projectId: project.id,
        userId: adminUser.id,
        role: 'Polier',
      },
      {
        tenantId: tenant.id,
        projectId: project.id,
        userId: managerUser.id,
        role: 'Bauleiter',
      },
    ],
    skipDuplicates: true,
  });

  // Kanban-Spalten
  await prisma.kanbanColumn.createMany({
    data: [
      {
        tenantId: tenant.id,
        key: KanbanColumnKey.GRUNDLAGEN,
        label: 'Grundlagen',
        order: 1,
      },
      {
        tenantId: tenant.id,
        key: KanbanColumnKey.BAUSTELLENEINRICHTUNG,
        label: 'Baustelleneinrichtung',
        order: 2,
      },
      {
        tenantId: tenant.id,
        key: KanbanColumnKey.BAUEN,
        label: 'Bauen',
        order: 3,
      },
      {
        tenantId: tenant.id,
        key: KanbanColumnKey.ZWISCHENRECHNUNG,
        label: 'Zwischenrechnung',
        order: 4,
      },
      {
        tenantId: tenant.id,
        key: KanbanColumnKey.ABRECHNUNG,
        label: 'Abrechnung',
        order: 5,
      },
    ],
    skipDuplicates: true,
  });

  const grundlagenColumn = await prisma.kanbanColumn.findFirst({
    where: { tenantId: tenant.id, key: KanbanColumnKey.GRUNDLAGEN },
  });

  // Aufgaben
  const task1 = await prisma.projectTask.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      title: 'Baugrundgutachten einholen',
      description: 'Gutachten vom Statiker prüfen lassen.',
      kanbanColumnId: grundlagenColumn?.id,
      assigneeId: managerUser.id,
      order: 1,
    },
  });

  // Task-Historie
  await prisma.taskStatusHistory.create({
    data: {
      tenantId: tenant.id,
      taskId: task1.id,
      fromColumnId: null,
      toColumnId: grundlagenColumn?.id ?? null,
      changedById: adminUser.id,
    },
  });

  // Fuhrpark-Kategorien
  const excavatorCategory = await prisma.equipmentCategory.create({
    data: {
      tenantId: tenant.id,
      name: 'Bagger',
    },
  });

  const equipment = await prisma.equipment.create({
    data: {
      tenantId: tenant.id,
      categoryId: excavatorCategory.id,
      name: 'Kettenbagger Liebherr R 922',
      type: 'Kettenbagger',
      licensePlate: 'B-CB 220',
      inventoryNo: 'EQ-0001',
      manufacturer: 'Liebherr',
      model: 'R 922',
      year: 2022,
      status: EquipmentStatus.IN_USE,
      notes: 'Eingesetzt auf Wohnanlage Prenzlauer Allee.',
    },
  });

  await prisma.equipmentAssignment.create({
    data: {
      tenantId: tenant.id,
      equipmentId: equipment.id,
      projectId: project.id,
      fromDate: new Date(),
    },
  });

  await prisma.equipmentMaintenance.create({
    data: {
      tenantId: tenant.id,
      equipmentId: equipment.id,
      date: new Date(),
      type: 'Übliche Wartung',
      notes: 'Schmierdienst und Sichtprüfung.',
    },
  });

  // Zeiteintrag
  const today = new Date();
  const fromTime = new Date(today);
  fromTime.setHours(7, 0, 0, 0);
  const toTime = new Date(today);
  toTime.setHours(15, 30, 0, 0);

  const timeEntry = await prisma.timeEntry.create({
    data: {
      tenantId: tenant.id,
      userId: managerUser.id,
      projectId: project.id,
      date: today,
      fromTime,
      toTime,
      breakMinutes: 30,
      hours: 8,
      activity: 'Baubesprechung und Koordination auf der Baustelle.',
      status: TimeEntryStatus.SUBMITTED,
    },
  });

  await prisma.timeEntryApproval.create({
    data: {
      tenantId: tenant.id,
      timeEntryId: timeEntry.id,
      approvedById: adminUser.id,
      status: TimeEntryStatus.APPROVED,
    },
  });

  // Tagesbericht
  const dailyReport = await prisma.dailyReport.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      date: today,
      weather: DailyReportWeather.SUN,
      notes: 'Rohbau im 2. OG weitgehend abgeschlossen.',
      authorId: managerUser.id,
    },
  });

  await prisma.dailyReportWorker.create({
    data: {
      tenantId: tenant.id,
      dailyReportId: dailyReport.id,
      userId: managerUser.id,
      hours: 8,
      activity: 'Bauleitung vor Ort',
    },
  });

  await prisma.dailyReportEquipment.create({
    data: {
      tenantId: tenant.id,
      dailyReportId: dailyReport.id,
      equipmentId: equipment.id,
      hours: 6,
      notes: 'Aushub für Tiefgarage',
    },
  });

  // Chat & Kalender
  const chat = await prisma.projectChat.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
    },
  });

  await prisma.projectChatMember.createMany({
    data: [
      {
        tenantId: tenant.id,
        chatId: chat.id,
        userId: adminUser.id,
      },
      {
        tenantId: tenant.id,
        chatId: chat.id,
        userId: managerUser.id,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.chatMessage.create({
    data: {
      tenantId: tenant.id,
      chatId: chat.id,
      senderId: managerUser.id,
      content: 'Morgen 8:00 Uhr Baustellenbegehung mit Statiker.',
    },
  });

  await prisma.schedule.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      title: 'Abstimmung mit Bauherr',
      start: today,
      end: new Date(today.getTime() + 60 * 60 * 1000),
    },
  });

  await prisma.ganttItem.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      name: 'Rohbau fertigstellen',
      start: today,
      end: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      progress: 40,
    },
  });

  await prisma.projectLocation.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      latitude: 52.538,
      longitude: 13.424,
    },
  });

  console.log('Seed-Daten erfolgreich erstellt.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

