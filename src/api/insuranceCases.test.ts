import { afterEach, describe, expect, test } from 'vitest';
import { InsuranceCaseParty, InsuranceCaseStatus, InsuranceCaseType, InsurerSide } from './dto';
import { caseForm, photoUrl } from './insuranceCases';
import { installResourceBase } from './transport';

/**
 * The two writes that carry photos (Follow-up 17): the case's fields under the request's member
 * names, a blank or missing value left out so the server reads it as none, and each photo as a part
 * named `photos` under the name the person chose it by.
 */
describe('the form of a write with photos', () => {
  test('each field under its member name, blank ones left out, the photos as parts named photos', async () => {
    const form = caseForm({
      type: InsuranceCaseType.Casco,
      vehicleId: 'car-1',
      damage: 'Rear bumper dented',
      description: '',
      happenedAtUtc: '2026-09-27T06:30:00.000Z',
      timeIsWhenFound: false,
      place: 'Riga, Brivibas iela 1',
      placeIsWhereFound: true,
      driverId: null,
      ourInsurerId: 'insurer-1',
      otherInsurerId: null,
      handledBy: InsurerSide.Ours,
      status: InsuranceCaseStatus.Happened,
      waitingFor: InsuranceCaseParty.Nobody,
      sameAccidentCaseId: undefined,
    }, [
      { file: new Blob(['one'], { type: 'image/jpeg' }), fileName: 'IMG_1.jpg' },
      { file: new Blob(['two'], { type: 'image/png' }), fileName: 'IMG_2.png' },
    ]);

    const names = [...form.keys()];
    expect(names).toEqual([
      'Type', 'VehicleId', 'Damage', 'HappenedAtUtc', 'TimeIsWhenFound', 'Place', 'PlaceIsWhereFound',
      'OurInsurerId', 'HandledBy', 'Status', 'WaitingFor', 'photos', 'photos',
    ]);
    expect(form.get('Type')).toBe('2');
    // Round 13 (Follow-up 18): an insurer goes by its id, one of the list; none is left out.
    expect(form.get('OurInsurerId')).toBe('insurer-1');
    expect(form.has('OtherInsurerId')).toBe(false);
    expect(form.get('TimeIsWhenFound')).toBe('false');
    expect(form.get('PlaceIsWhereFound')).toBe('true');
    // Nobody is 5, never 0 (the API's enums have no 0).
    expect(form.get('WaitingFor')).toBe('5');
    const photos = form.getAll('photos') as File[];
    expect(photos.map((photo) => photo.name)).toEqual(['IMG_1.jpg', 'IMG_2.png']);
    expect(await photos[1]!.text()).toBe('two');
  });

  test('without photos the form holds the fields alone', () => {
    const form = caseForm({ title: 'Reported', statusNow: InsuranceCaseStatus.Reported });
    expect([...form.keys()]).toEqual(['Title', 'StatusNow']);
  });
});

describe('where the browser reads a picture', () => {
  afterEach(() => installResourceBase(''));

  test('the API’s own address, the path of the photo', () => {
    expect(photoUrl('case-1', 'photo-2')).toBe('/api/insurance-cases/case-1/photos/photo-2');
    installResourceBase('http://localhost:5002');
    expect(photoUrl('case-1', 'photo-2')).toBe('http://localhost:5002/api/insurance-cases/case-1/photos/photo-2');
  });
});
